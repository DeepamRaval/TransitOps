from sqlalchemy.orm import Session

from .config import settings
from .models import User
from .security import VALID_ROLES, hash_password

DEMO_USERS = [
    {"email": "fleet.manager@transitops.dev", "name": "Alex Morgan", "role": "Fleet Manager"},
    {"email": "driver@transitops.dev", "name": "Jordan Lee", "role": "Driver"},
    {"email": "safety@transitops.dev", "name": "Sam Rivera", "role": "Safety Officer"},
    {"email": "finance@transitops.dev", "name": "Taylor Chen", "role": "Financial Analyst"},
]


def seed_demo_users(db: Session) -> None:
    password_hash = hash_password(settings.SEED_DEMO_PASSWORD)

    for demo in DEMO_USERS:
        if demo["role"] not in VALID_ROLES:
            continue
        existing = db.query(User).filter(User.email == demo["email"]).first()
        if existing:
            continue
        db.add(
            User(
                email=demo["email"],
                name=demo["name"],
                password_hash=password_hash,
                role=demo["role"],
                email_verified=True,
            )
        )

    db.commit()
