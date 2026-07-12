from datetime import date, timedelta

from sqlalchemy.orm import Session

from .config import settings
from .models import Driver, User, Vehicle, Trip
from .security import VALID_ROLES, hash_password

DEMO_USERS = [
    {"email": "fleet.manager@transitops.dev", "name": "Alex Morgan", "role": "Fleet Manager"},
    {"email": "driver@transitops.dev", "name": "Jordan Lee", "role": "Driver"},
    {"email": "safety@transitops.dev", "name": "Sam Rivera", "role": "Safety Officer"},
    {"email": "finance@transitops.dev", "name": "Taylor Chen", "role": "Financial Analyst"},
]

DEMO_VEHICLES = [
    {
        "registration_number": "Van-05",
        "name_model": "Tata Ace HT",
        "type": "Van",
        "max_load_capacity": 500.0,
        "odometer": 12450.0,
        "acquisition_cost": 450000.0,
        "status": "Available",
        "region": "South",
    },
    {
        "registration_number": "TRK-12",
        "name_model": "Ashok Leyland Dost",
        "type": "Truck",
        "max_load_capacity": 1500.0,
        "odometer": 48200.0,
        "acquisition_cost": 1200000.0,
        "status": "Available",
        "region": "West",
    },
    {
        "registration_number": "SED-03",
        "name_model": "Honda City",
        "type": "Sedan",
        "max_load_capacity": 200.0,
        "odometer": 8900.0,
        "acquisition_cost": 850000.0,
        "status": "On Trip",
        "region": "North",
    },
    {
        "registration_number": "CNT-08",
        "name_model": "Eicher Pro 3015",
        "type": "Container",
        "max_load_capacity": 3000.0,
        "odometer": 91000.0,
        "acquisition_cost": 2100000.0,
        "status": "In Shop",
        "region": "East",
    },
]

DEMO_DRIVERS = [
    {
        "name": "Alex Kumar",
        "license_number": "DL-0420190012345",
        "license_category": "LMV",
        "license_expiry_date": date.today() + timedelta(days=365),
        "contact_number": "+91 98765 43210",
        "safety_score": 96.0,
        "status": "Available",
    },
    {
        "name": "Priya Nair",
        "license_number": "KA-0520180098765",
        "license_category": "HMV",
        "license_expiry_date": date.today() + timedelta(days=18),
        "contact_number": "+91 91234 56789",
        "safety_score": 88.0,
        "status": "Available",
    },
    {
        "name": "Rahul Singh",
        "license_number": "MH-0320170045678",
        "license_category": "HGV",
        "license_expiry_date": date.today() - timedelta(days=12),
        "contact_number": "+91 99887 76655",
        "safety_score": 72.0,
        "status": "Suspended",
    },
    {
        "name": "Meera Joshi",
        "license_number": "GJ-0620200032109",
        "license_category": "LMV",
        "license_expiry_date": date.today() + timedelta(days=200),
        "contact_number": "+91 90123 45678",
        "safety_score": 94.0,
        "status": "On Trip",
    },
    {
        "name": "Jordan Lee",
        "license_number": "MH-1220210045678",
        "license_category": "LMV",
        "license_expiry_date": date.today() + timedelta(days=120),
        "contact_number": "+91 99999 88888",
        "safety_score": 90.0,
        "status": "Available",
    },
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


def seed_demo_fleet(db: Session) -> None:
    for demo in DEMO_VEHICLES:
        if db.query(Vehicle).filter(Vehicle.registration_number == demo["registration_number"]).first():
            continue
        db.add(Vehicle(**demo))

    for demo in DEMO_DRIVERS:
        if db.query(Driver).filter(Driver.license_number == demo["license_number"]).first():
            continue
        db.add(Driver(**demo))

    db.commit()


def seed_demo_trips(db: Session) -> None:
    # Get the vehicles and drivers we seeded
    van = db.query(Vehicle).filter(Vehicle.registration_number == "Van-05").first()
    dost = db.query(Vehicle).filter(Vehicle.registration_number == "TRK-12").first()
    honda = db.query(Vehicle).filter(Vehicle.registration_number == "SED-03").first()

    alex = db.query(Driver).filter(Driver.name == "Alex Kumar").first()
    priya = db.query(Driver).filter(Driver.name == "Priya Nair").first()
    jordan = db.query(Driver).filter(Driver.name == "Jordan Lee").first()

    if not van or not dost or not honda or not alex or not priya or not jordan:
        return

    DEMO_TRIPS = [
        {
            "source": "Mumbai Warehouse A",
            "destination": "Pune Distribution Center",
            "vehicle_id": van.id,
            "driver_id": alex.id,
            "cargo_weight": 400.0,
            "planned_distance": 150.0,
            "actual_distance": 148.5,
            "fuel_consumed": 12.5,
            "revenue": 15000.0,
            "status": "Completed"
        },
        {
            "source": "Bengaluru Hub",
            "destination": "Chennai Port",
            "vehicle_id": honda.id,
            "driver_id": jordan.id,
            "cargo_weight": 150.0,
            "planned_distance": 350.0,
            "actual_distance": None,
            "fuel_consumed": None,
            "revenue": 35000.0,
            "status": "In Transit"
        },
        {
            "source": "Delhi Cargo Terminal",
            "destination": "Gurugram Depot",
            "vehicle_id": dost.id,
            "driver_id": priya.id,
            "cargo_weight": 1200.0,
            "planned_distance": 45.0,
            "actual_distance": None,
            "fuel_consumed": None,
            "revenue": 8000.0,
            "status": "Scheduled"
        }
    ]

    for demo in DEMO_TRIPS:
        existing = db.query(Trip).filter(
            Trip.source == demo["source"],
            Trip.destination == demo["destination"],
            Trip.vehicle_id == demo["vehicle_id"]
        ).first()
        if existing:
            continue

        trip = Trip(**demo)
        db.add(trip)

        # Sync vehicle/driver statuses for the "In Transit" trip
        if demo["status"] == "In Transit":
            honda.status = "On Trip"
            jordan.status = "On Trip"

    db.commit()


def seed_all(db: Session) -> None:
    seed_demo_users(db)
    seed_demo_fleet(db)
    seed_demo_trips(db)
