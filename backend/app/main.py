import asyncio
from contextlib import asynccontextmanager
from datetime import date
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .database import Base, SessionLocal, engine
from . import models
from .routers import auth, dashboard, drivers, expenses, maintenance, reports, trips, vehicles
from .seed import seed_all
from .services.license_reminders import run_license_reminder_scheduler

def seed_db(db):
    try:
        # Seed Vehicles
        if db.query(models.Vehicle).count() == 0:
            vehicles = [
                models.Vehicle(registration_number="VAN-05", name_model="Ford Transit", type="Van", max_load_capacity=500.0, odometer=15000.0, acquisition_cost=25000.0, status="On Trip", region="North"),
                models.Vehicle(registration_number="TRUCK-11", name_model="Volvo FH16 Heavy", type="Truck", max_load_capacity=5000.0, odometer=80000.0, acquisition_cost=120000.0, status="Available", region="South"),
                models.Vehicle(registration_number="MINI-08", name_model="Tata Ace Zip", type="Van", max_load_capacity=350.0, odometer=12000.0, acquisition_cost=15000.0, status="Available", region="West"),
                models.Vehicle(registration_number="TRK-12", name_model="Volvo FMX", type="Truck", max_load_capacity=4500.0, odometer=55000.0, acquisition_cost=110000.0, status="In Shop", region="East"),
                models.Vehicle(registration_number="MINI-03", name_model="Tata Super Ace", type="Van", max_load_capacity=400.0, odometer=18000.0, acquisition_cost=18000.0, status="Available", region="North"),
                models.Vehicle(registration_number="TRK-01", name_model="Scania R500", type="Truck", max_load_capacity=6000.0, odometer=110000.0, acquisition_cost=135000.0, status="On Trip", region="North"),
                models.Vehicle(registration_number="TRK-02", name_model="MAN TGX", type="Truck", max_load_capacity=5500.0, odometer=92000.0, acquisition_cost=125000.0, status="Available", region="South"),
                models.Vehicle(registration_number="VAN-02", name_model="Mercedes Sprinter", type="Van", max_load_capacity=600.0, odometer=31000.0, acquisition_cost=32000.0, status="Available", region="East"),
                models.Vehicle(registration_number="VAN-03", name_model="Renault Master", type="Van", max_load_capacity=550.0, odometer=42000.0, acquisition_cost=28000.0, status="In Shop", region="West"),
                models.Vehicle(registration_number="TRK-04", name_model="BharatBenz 3723", type="Truck", max_load_capacity=8000.0, odometer=125000.0, acquisition_cost=95000.0, status="Available", region="South"),
                models.Vehicle(registration_number="TRK-05", name_model="Ashok Leyland 3120", type="Truck", max_load_capacity=7500.0, odometer=140000.0, acquisition_cost=88000.0, status="Retired", region="North")
            ]
            db.add_all(vehicles)
            db.commit()
            
        # Seed Drivers
        if db.query(models.Driver).count() == 0:
            drivers = [
                models.Driver(name="Alex", license_number="DL-0505", license_category="B", license_expiry_date=date(2029, 1, 1), contact_number="9876543210", status="On Trip"),
                models.Driver(name="John", license_number="DL-1111", license_category="A", license_expiry_date=date(2030, 2, 2), contact_number="8888888888", status="Available"),
                models.Driver(name="Priya", license_number="DL-8888", license_category="B", license_expiry_date=date(2028, 5, 5), contact_number="7777777777", status="Available"),
                models.Driver(name="Rahul", license_number="DL-2222", license_category="A", license_expiry_date=date(2029, 6, 12), contact_number="9998887776", status="On Trip"),
                models.Driver(name="Vikram", license_number="DL-3333", license_category="A", license_expiry_date=date(2030, 9, 30), contact_number="8887776665", status="On Trip"),
                models.Driver(name="Ananya", license_number="DL-4444", license_category="B", license_expiry_date=date(2027, 4, 15), contact_number="7776665554", status="Available")
            ]
            db.add_all(drivers)
            db.commit()

        # Seed Trips
        if db.query(models.Trip).count() == 0:
            v_van05 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "VAN-05").first()
            v_trk12 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-12").first()
            v_mini08 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "MINI-08").first()
            v_trk01 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-01").first()
            v_trk02 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-02").first()
            v_van02 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "VAN-02").first()
            v_trk04 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-04").first()
            
            d_alex = db.query(models.Driver).filter(models.Driver.name == "Alex").first()
            d_john = db.query(models.Driver).filter(models.Driver.name == "John").first()
            d_priya = db.query(models.Driver).filter(models.Driver.name == "Priya").first()
            d_rahul = db.query(models.Driver).filter(models.Driver.name == "Rahul").first()
            d_vikram = db.query(models.Driver).filter(models.Driver.name == "Vikram").first()
            d_ananya = db.query(models.Driver).filter(models.Driver.name == "Ananya").first()

            trips = [
                models.Trip(source="Mumbai", destination="Pune", vehicle_id=v_van05.id, driver_id=d_alex.id, cargo_weight=350.0, planned_distance=150.0, actual_distance=150.0, fuel_consumed=18.0, revenue=15000.0, status="On Trip"),
                models.Trip(source="Delhi", destination="Noida", vehicle_id=v_trk12.id, driver_id=d_john.id, cargo_weight=4500.0, planned_distance=60.0, actual_distance=60.0, fuel_consumed=35.0, revenue=45000.0, status="Completed"),
                models.Trip(source="Bangalore", destination="Chennai", vehicle_id=v_mini08.id, driver_id=d_priya.id, cargo_weight=200.0, planned_distance=350.0, actual_distance=350.0, fuel_consumed=38.0, revenue=28000.0, status="Completed"),
                models.Trip(source="Kolkata", destination="Patna", vehicle_id=v_van05.id, driver_id=d_alex.id, cargo_weight=300.0, planned_distance=580.0, actual_distance=580.0, fuel_consumed=60.0, revenue=35000.0, status="Completed"),
                models.Trip(source="Chennai", destination="Hyderabad", vehicle_id=v_trk01.id, driver_id=d_rahul.id, cargo_weight=5200.0, planned_distance=620.0, actual_distance=620.0, fuel_consumed=180.0, revenue=75000.0, status="On Trip"),
                models.Trip(source="Ahmedabad", destination="Jaipur", vehicle_id=v_trk02.id, driver_id=d_vikram.id, cargo_weight=4800.0, planned_distance=670.0, actual_distance=670.0, fuel_consumed=190.0, revenue=80000.0, status="On Trip"),
                models.Trip(source="Delhi", destination="Chandigarh", vehicle_id=v_van02.id, driver_id=d_ananya.id, cargo_weight=400.0, planned_distance=250.0, actual_distance=250.0, fuel_consumed=28.0, revenue=22000.0, status="Completed"),
                models.Trip(source="Pune", destination="Bangalore", vehicle_id=v_trk04.id, driver_id=d_john.id, cargo_weight=7800.0, planned_distance=840.0, actual_distance=840.0, fuel_consumed=240.0, revenue=95000.0, status="Completed")
            ]
            db.add_all(trips)
            db.commit()

        # Seed Fuel Logs
        if db.query(models.FuelLog).count() == 0:
            v_van05 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "VAN-05").first()
            v_trk11 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRUCK-11").first()
            v_mini08 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "MINI-08").first()
            v_trk01 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-01").first()
            v_trk02 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-02").first()

            fl = [
                models.FuelLog(vehicle_id=v_van05.id, liters=42.0, cost=3150.0, date=date(2026, 7, 5)),
                models.FuelLog(vehicle_id=v_van05.id, liters=38.0, cost=2850.0, date=date(2026, 6, 20)),
                models.FuelLog(vehicle_id=v_van05.id, liters=45.0, cost=3375.0, date=date(2026, 5, 10)),
                models.FuelLog(vehicle_id=v_trk11.id, liters=110.0, cost=8400.0, date=date(2026, 7, 6)),
                models.FuelLog(vehicle_id=v_trk11.id, liters=115.0, cost=8800.0, date=date(2026, 6, 15)),
                models.FuelLog(vehicle_id=v_mini08.id, liters=28.0, cost=2050.0, date=date(2026, 7, 6)),
                models.FuelLog(vehicle_id=v_mini08.id, liters=30.0, cost=2200.0, date=date(2026, 6, 28)),
                models.FuelLog(vehicle_id=v_trk01.id, liters=180.0, cost=13500.0, date=date(2026, 7, 6)),
                models.FuelLog(vehicle_id=v_trk02.id, liters=190.0, cost=14250.0, date=date(2026, 7, 6))
            ]
            db.add_all(fl)
            db.commit()

        # Seed Expenses
        if db.query(models.Expense).count() == 0:
            v_van05 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "VAN-05").first()
            v_trk12 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-12").first()
            v_trk01 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-01").first()
            v_trk02 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "TRK-02").first()
            v_van03 = db.query(models.Vehicle).filter(models.Vehicle.registration_number == "VAN-03").first()

            expenses = [
                models.Expense(vehicle_id=v_van05.id, category="Toll", cost=120.0, date=date(2026, 7, 5), description="Highway NH-4 Toll"),
                models.Expense(vehicle_id=v_van05.id, category="Toll", cost=150.0, date=date(2026, 6, 20), description="Lonavala Expressway Toll"),
                models.Expense(vehicle_id=v_trk12.id, category="Toll", cost=340.0, date=date(2026, 7, 6), description="Flyover Toll"),
                models.Expense(vehicle_id=v_trk12.id, category="Other", cost=150.0, date=date(2026, 7, 6), description="Parking fees"),
                models.Expense(vehicle_id=v_trk12.id, category="Maintenance", cost=18000.0, date=date(2026, 7, 6), description="Engine overhaul"),
                models.Expense(vehicle_id=v_trk01.id, category="Toll", cost=550.0, date=date(2026, 7, 6), description="State border entry tax"),
                models.Expense(vehicle_id=v_trk01.id, category="Other", cost=250.0, date=date(2026, 7, 6), description="Weighbridge check charge"),
                models.Expense(vehicle_id=v_trk02.id, category="Toll", cost=600.0, date=date(2026, 7, 6), description="National highway toll"),
                models.Expense(vehicle_id=v_trk02.id, category="Maintenance", cost=12000.0, date=date(2026, 6, 12), description="Brake pad replacement"),
                models.Expense(vehicle_id=v_van03.id, category="Maintenance", cost=6500.0, date=date(2026, 7, 1), description="General servicing and oil change")
            ]
            db.add_all(expenses)
            db.commit()

    except Exception as e:
        print(f"Error seeding database: {e}")

def ensure_compatible_schema() -> None:
    inspector = inspect(engine)
    if "drivers" not in inspector.get_table_names():
        return

    driver_columns = {column["name"] for column in inspector.get_columns("drivers")}
    with engine.begin() as conn:
        if "email" not in driver_columns:
            conn.execute(text("ALTER TABLE drivers ADD COLUMN email VARCHAR(255)"))

        rows = conn.execute(text("SELECT id FROM drivers WHERE email IS NULL OR email = ''")).fetchall()
        for row in rows:
            driver_id = row[0]
            conn.execute(
                text("UPDATE drivers SET email = :email WHERE id = :driver_id"),
                {"email": f"driver-{driver_id}@placeholder.transitops.dev", "driver_id": driver_id},
            )
        legacy_rows = conn.execute(text("SELECT id FROM drivers WHERE email LIKE '%@transitops.local'")).fetchall()
        for row in legacy_rows:
            driver_id = row[0]
            conn.execute(
                text("UPDATE drivers SET email = :email WHERE id = :driver_id"),
                {"email": f"driver-{driver_id}@placeholder.transitops.dev", "driver_id": driver_id},
            )


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_compatible_schema()
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
    reminder_task = asyncio.create_task(run_license_reminder_scheduler())
    try:
        yield
    finally:
        reminder_task.cancel()
        try:
            await reminder_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title="TransitOps API Gateway",
    description="FastAPI REST Backend for Smart Transport Operations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
def hello_world():
    return {"message": "TransitOps API is running"}
