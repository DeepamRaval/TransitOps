from contextlib import asynccontextmanager
from datetime import date
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from . import models
from .routers import auth, dashboard, drivers, expenses, maintenance, reports, trips, vehicles
from .seed import seed_demo_users

def seed_db(db):
    try:
        if db.query(models.Vehicle).count() == 0:
            v1 = models.Vehicle(registration_number="VAN-05", name_model="Ford Transit", type="Van", max_load_capacity=500.0, odometer=15000.0, acquisition_cost=20000.0, status="Available")
            v2 = models.Vehicle(registration_number="TRUCK-12", name_model="Volvo FH16 Heavy", type="Truck", max_load_capacity=5000.0, odometer=80000.0, acquisition_cost=120000.0, status="Available")
            v3 = models.Vehicle(registration_number="CAR-01", name_model="Toyota Prius", type="Sedan", max_load_capacity=350.0, odometer=12000.0, acquisition_cost=25000.0, status="Available")
            db.add_all([v1, v2, v3])
            db.commit()
            
        if db.query(models.Driver).count() == 0:
            d1 = models.Driver(name="Alex Johnson", license_number="DL-987654", license_category="B", license_expiry_date=date(2028, 12, 31), contact_number="123-456-7890", status="Available")
            d2 = models.Driver(name="Sarah Miller", license_number="DL-123456", license_category="B", license_expiry_date=date(2027, 6, 15), contact_number="987-654-3210", status="Available")
            d3 = models.Driver(name="Bob Smith", license_number="DL-112233", license_category="A", license_expiry_date=date(2029, 1, 1), contact_number="555-555-5555", status="Available")
            db.add_all([d1, d2, d3])
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_users(db)
        seed_db(db)
    finally:
        db.close()
    yield

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
