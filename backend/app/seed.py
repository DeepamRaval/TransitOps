from datetime import date, timedelta
from sqlalchemy.orm import Session
from .config import settings
from .models import Driver, User, Vehicle, Trip, FuelLog, Expense
from .security import VALID_ROLES, hash_password

DEMO_USERS = [
    {"email": "fleet.manager@transitops.dev", "name": "Alex Morgan", "role": "Fleet Manager"},
    {"email": "driver@transitops.dev", "name": "Jordan Lee", "role": "Driver"},
    {"email": "safety@transitops.dev", "name": "Sam Rivera", "role": "Safety Officer"},
    {"email": "finance@transitops.dev", "name": "Taylor Chen", "role": "Financial Analyst"},
]

DEMO_VEHICLES = [
    {"registration_number": "VAN-05", "name_model": "Tata Ace HT", "type": "Van", "max_load_capacity": 500.0, "odometer": 12450.0, "acquisition_cost": 450000.0, "status": "Available", "region": "South"},
    {"registration_number": "TRUCK-11", "name_model": "Volvo FH16 Heavy", "type": "Truck", "max_load_capacity": 1500.0, "odometer": 48200.0, "acquisition_cost": 1200000.0, "status": "Available", "region": "West"},
    {"registration_number": "MINI-08", "name_model": "Tata Ace Zip", "type": "Van", "max_load_capacity": 200.0, "odometer": 8900.0, "acquisition_cost": 850000.0, "status": "On Trip", "region": "North"},
    {"registration_number": "TRK-12", "name_model": "Ashok Leyland Dost", "type": "Truck", "max_load_capacity": 3000.0, "odometer": 91000.0, "acquisition_cost": 2100000.0, "status": "Available", "region": "East"},
    {"registration_number": "MINI-03", "name_model": "Mahindra Supro", "type": "Van", "max_load_capacity": 300.0, "odometer": 15000.0, "acquisition_cost": 500000.0, "status": "Available", "region": "South"},
]

DEMO_DRIVERS = [
    {"name": "Alex Kumar", "email": "alex.kumar@transitops.dev", "license_number": "DL-0420190012345", "license_category": "LMV", "license_expiry_date": date.today() + timedelta(days=365), "contact_number": "+91 98765 43210", "safety_score": 96.0, "status": "Available"},
    {"name": "Priya Nair", "email": "priya.nair@transitops.dev", "license_number": "KA-0520180098765", "license_category": "HMV", "license_expiry_date": date.today() + timedelta(days=18), "contact_number": "+91 91234 56789", "safety_score": 88.0, "status": "Available"},
    {"name": "Jordan Lee", "email": "jordan.lee@transitops.dev", "license_number": "MH-1220210045678", "license_category": "LMV", "license_expiry_date": date.today() + timedelta(days=120), "contact_number": "+91 99999 88888", "safety_score": 90.0, "status": "On Trip"},
]


def seed_demo_users(db: Session) -> None:
    password_hash = hash_password(settings.SEED_DEMO_PASSWORD)
    for demo in DEMO_USERS:
        if demo["role"] not in VALID_ROLES:
            continue
        if db.query(User).filter(User.email == demo["email"]).first():
            continue
        db.add(User(email=demo["email"], name=demo["name"], password_hash=password_hash, role=demo["role"], email_verified=True))
    db.commit()


def seed_demo_fleet(db: Session) -> None:
    for demo in DEMO_VEHICLES:
        if db.query(Vehicle).filter(Vehicle.registration_number == demo["registration_number"]).first():
            continue
        db.add(Vehicle(**demo))

    for demo in DEMO_DRIVERS:
        existing = db.query(Driver).filter(Driver.license_number == demo["license_number"]).first()
        if existing:
            if not existing.email:
                existing.email = demo["email"]
            continue
        db.add(Driver(**demo))
    db.commit()


def seed_demo_trips(db: Session) -> None:
    van05 = db.query(Vehicle).filter(Vehicle.registration_number == "VAN-05").first()
    trk11 = db.query(Vehicle).filter(Vehicle.registration_number == "TRUCK-11").first()
    mini08 = db.query(Vehicle).filter(Vehicle.registration_number == "MINI-08").first()
    trk12 = db.query(Vehicle).filter(Vehicle.registration_number == "TRK-12").first()

    alex = db.query(Driver).filter(Driver.name == "Alex Kumar").first()
    priya = db.query(Driver).filter(Driver.name == "Priya Nair").first()
    jordan = db.query(Driver).filter(Driver.name == "Jordan Lee").first()

    if not all([van05, trk11, mini08, trk12, alex, priya, jordan]):
        return

    DEMO_TRIPS = [
        {"source": "Mumbai Warehouse A", "destination": "Pune Distribution Center", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 400.0, "planned_distance": 150.0, "actual_distance": 148.5, "fuel_consumed": 12.5, "revenue": 15000.0, "status": "Completed", "start_date": date(2026, 7, 5)},
        {"source": "Delhi Cargo Terminal", "destination": "Gurugram Depot", "vehicle_id": trk12.id, "driver_id": priya.id, "cargo_weight": 1200.0, "planned_distance": 45.0, "actual_distance": 45.0, "fuel_consumed": 4.2, "revenue": 8000.0, "status": "Completed", "start_date": date(2026, 7, 6)},
        {"source": "Bengaluru Hub", "destination": "Chennai Port", "vehicle_id": mini08.id, "driver_id": jordan.id, "cargo_weight": 150.0, "planned_distance": 350.0, "actual_distance": None, "fuel_consumed": None, "revenue": 35000.0, "status": "Dispatched", "start_date": date(2026, 7, 6)},
        {"source": "Hub Jan", "destination": "Depot Jan", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 100.0, "planned_distance": 100.0, "actual_distance": 100.0, "fuel_consumed": 10.0, "revenue": 10000.0, "status": "Completed", "start_date": date(2026, 1, 15)},
        {"source": "Hub Feb", "destination": "Depot Feb", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 100.0, "planned_distance": 100.0, "actual_distance": 100.0, "fuel_consumed": 10.0, "revenue": 15000.0, "status": "Completed", "start_date": date(2026, 2, 10)},
        {"source": "Hub Mar", "destination": "Depot Mar", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 100.0, "planned_distance": 100.0, "actual_distance": 100.0, "fuel_consumed": 10.0, "revenue": 12000.0, "status": "Completed", "start_date": date(2026, 3, 20)},
        {"source": "Hub Apr", "destination": "Depot Apr", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 100.0, "planned_distance": 100.0, "actual_distance": 100.0, "fuel_consumed": 10.0, "revenue": 18000.0, "status": "Completed", "start_date": date(2026, 4, 25)},
        {"source": "Hub May", "destination": "Depot May", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 100.0, "planned_distance": 100.0, "actual_distance": 100.0, "fuel_consumed": 10.0, "revenue": 23000.0, "status": "Completed", "start_date": date(2026, 5, 12)},
        {"source": "Hub Jun", "destination": "Depot Jun", "vehicle_id": van05.id, "driver_id": alex.id, "cargo_weight": 100.0, "planned_distance": 100.0, "actual_distance": 100.0, "fuel_consumed": 10.0, "revenue": 22000.0, "status": "Completed", "start_date": date(2026, 6, 18)},
    ]

    for demo in DEMO_TRIPS:
        if db.query(Trip).filter(Trip.source == demo["source"], Trip.destination == demo["destination"], Trip.vehicle_id == demo["vehicle_id"]).first():
            continue
        db.add(Trip(**demo))
    db.commit()


def seed_demo_expenses(db: Session) -> None:
    van05 = db.query(Vehicle).filter(Vehicle.registration_number == "VAN-05").first()
    trk11 = db.query(Vehicle).filter(Vehicle.registration_number == "TRUCK-11").first()
    mini08 = db.query(Vehicle).filter(Vehicle.registration_number == "MINI-08").first()
    trk12 = db.query(Vehicle).filter(Vehicle.registration_number == "TRK-12").first()

    if db.query(FuelLog).count() == 0:
        if van05:
            db.add(FuelLog(vehicle_id=van05.id, liters=42.0, cost=3150.0, date=date(2026, 7, 5)))
        if trk11:
            db.add(FuelLog(vehicle_id=trk11.id, liters=110.0, cost=8400.0, date=date(2026, 7, 6)))
        if mini08:
            db.add(FuelLog(vehicle_id=mini08.id, liters=28.0, cost=2050.0, date=date(2026, 7, 6)))
            # Extra log to make total operational cost match exactly ₹34,070
            db.add(FuelLog(vehicle_id=mini08.id, liters=24.0, cost=1860.0, date=date(2026, 7, 4)))
        db.commit()

    if db.query(Expense).count() == 0:
        if van05:
            db.add(Expense(vehicle_id=van05.id, category="Toll", cost=120.0, date=date(2026, 7, 5), description="Expressway Toll"))
        if trk12:
            db.add(Expense(vehicle_id=trk12.id, category="Toll", cost=340.0, date=date(2026, 7, 6), description="Highway Toll"))
            db.add(Expense(vehicle_id=trk12.id, category="Other", cost=150.0, date=date(2026, 7, 6), description="Misc Weighing Charges"))
            db.add(Expense(vehicle_id=trk12.id, category="Maintenance", cost=18000.0, date=date(2026, 7, 6), description="Workshop Service"))
        db.commit()


def seed_all(db: Session) -> None:
    seed_demo_users(db)
    seed_demo_fleet(db)
    seed_demo_trips(db)
    seed_demo_expenses(db)
