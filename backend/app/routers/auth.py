from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..email_service import send_otp_email
from ..models import OtpCode, User
from ..schemas import (
    LoginRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    Token,
    UserCreate,
    UserResponse,
    VerifyOtpRequest,
)
from ..security import (
    VALID_ROLES,
    create_access_token,
    generate_otp,
    hash_password,
    lock_expires_at,
    otp_expires_at,
    verify_password,
)

router = APIRouter()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _is_account_locked(user: User) -> bool:
    if not user.locked_until:
        return False
    locked_until = user.locked_until
    if locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) < locked_until


def _invalidate_old_otps(db: Session, email: str, purpose: str) -> None:
    db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.purpose == purpose,
        OtpCode.used.is_(False),
    ).update({"used": True})
    db.commit()


def _find_valid_otp(db: Session, email: str, otp: str, purpose: str) -> OtpCode:
    record = (
        db.query(OtpCode)
        .filter(
            OtpCode.email == email,
            OtpCode.purpose == purpose,
            OtpCode.code == otp,
            OtpCode.used.is_(False),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired")

    return record


def _consume_otp(db: Session, record: OtpCode) -> None:
    record.used = True
    db.commit()


def _issue_token(user: User) -> Token:
    access_token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/send-otp")
def send_otp(payload: SendOtpRequest, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)
    purpose = payload.purpose

    if purpose not in {"register", "reset_password"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP purpose")

    user = db.query(User).filter(User.email == email).first()

    if purpose == "register" and user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if purpose == "reset_password" and not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if user and _is_account_locked(user):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked. Try again later.",
        )

    _invalidate_old_otps(db, email, purpose)
    code = generate_otp()
    db.add(
        OtpCode(
            email=email,
            code=code,
            purpose=purpose,
            expires_at=otp_expires_at(),
        )
    )
    db.commit()

    try:
        send_otp_email(email, code, purpose)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send verification email: {exc}",
        ) from exc

    return {"message": "Verification code sent", "email": email}


@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)
    if payload.purpose not in {"register", "reset_password"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP purpose")

    _find_valid_otp(db, email, payload.otp.strip(), payload.purpose)
    return {"message": "Verification code accepted", "email": email}


@router.post("/register", response_model=Token)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)

    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    otp_record = _find_valid_otp(db, email, payload.otp.strip(), "register")

    user = User(
        email=email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        email_verified=True,
        failed_login_attempts=0,
        locked_until=None,
    )
    db.add(user)
    db.commit()
    _consume_otp(db, otp_record)
    db.refresh(user)
    return _issue_token(user)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if _is_account_locked(user):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked after {settings.MAX_LOGIN_ATTEMPTS} failed attempts. Try again in {settings.ACCOUNT_LOCK_MINUTES} minutes.",
        )

    if not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        remaining = settings.MAX_LOGIN_ATTEMPTS - user.failed_login_attempts

        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = lock_expires_at()
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked after {settings.MAX_LOGIN_ATTEMPTS} failed attempts. Try again in {settings.ACCOUNT_LOCK_MINUTES} minutes.",
            )

        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. {remaining} attempt(s) remaining before lockout.",
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    return _issue_token(user)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = _normalize_email(payload.email)
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    otp_record = _find_valid_otp(db, email, payload.otp.strip(), "reset_password")

    user.password_hash = hash_password(payload.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    _consume_otp(db, otp_record)
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
