from datetime import date, timedelta
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..enums import DRIVER_STATUSES
from ..models import Driver, User
from ..schemas import DriverCreate, DriverResponse, DriverUpdate
from ..services.license_reminders import send_due_license_reminders

router = APIRouter()

FleetManager = Annotated[User, Depends(require_roles("Fleet Manager"))]
DriverEditor = Annotated[User, Depends(require_roles("Fleet Manager", "Safety Officer"))]
Authenticated = Annotated[User, Depends(get_current_user)]


def _get_driver_or_404(driver_id: int, db: Session) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


def _apply_driver_filters(query, status: Optional[str], expiring_within_days: Optional[int]):
    if status:
        if status not in DRIVER_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Use: {', '.join(DRIVER_STATUSES)}")
        query = query.filter(Driver.status == status)
    if expiring_within_days is not None:
        cutoff = date.today() + timedelta(days=expiring_within_days)
        query = query.filter(Driver.license_expiry_date <= cutoff)
    return query


def _send_due_license_reminders_safely(db: Session) -> None:
    try:
        send_due_license_reminders(db)
    except Exception as exc:
        db.rollback()
        print(f"Failed to send driver license expiry reminder after driver save: {exc}")


@router.get("/", response_model=list[DriverResponse])
def list_drivers(
    _: Authenticated,
    db: Annotated[Session, Depends(get_db)],
    status: Optional[str] = Query(default=None, description="Filter by status"),
    expiring_within_days: Optional[int] = Query(default=None, ge=0, description="Licenses expiring within N days"),
):
    query = db.query(Driver)
    query = _apply_driver_filters(query, status, expiring_within_days)
    drivers = query.order_by(Driver.name).all()
    return [DriverResponse.from_orm_with_flags(d) for d in drivers]


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, _: Authenticated, db: Annotated[Session, Depends(get_db)]):
    return DriverResponse.from_orm_with_flags(_get_driver_or_404(driver_id, db))


@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(payload: DriverCreate, _: FleetManager, db: Annotated[Session, Depends(get_db)]):
    driver = Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    _send_due_license_reminders_safely(db)
    return DriverResponse.from_orm_with_flags(driver)


@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    _: DriverEditor,
    db: Annotated[Session, Depends(get_db)],
):
    driver = _get_driver_or_404(driver_id, db)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    _send_due_license_reminders_safely(db)
    return DriverResponse.from_orm_with_flags(driver)


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(driver_id: int, _: FleetManager, db: Annotated[Session, Depends(get_db)]):
    driver = _get_driver_or_404(driver_id, db)
    db.delete(driver)
    db.commit()
    return None
