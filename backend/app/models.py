from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # e.g., Fleet Manager, Driver, Safety Officer, Financial Analyst

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(100), unique=True, index=True, nullable=False)
    name_model = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # e.g., Truck, Van, Sedan, Container
    max_load_capacity = Column(Float, nullable=False)  # in kg
    odometer = Column(Float, default=0.0)  # in km
    acquisition_cost = Column(Float, nullable=False)
    status = Column(String(50), default="Available")  # Available, On Trip, In Shop, Retired
    region = Column(String(100), nullable=True)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    license_number = Column(String(100), nullable=False)
    license_category = Column(String(50), nullable=False)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String(50), nullable=False)
    safety_score = Column(Float, default=100.0)
    status = Column(String(50), default="Available")  # Available, On Trip, Off Duty, Suspended

    trips = relationship("Trip", back_populates="driver")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight = Column(Float, nullable=False)
    planned_distance = Column(Float, nullable=False)
    actual_distance = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)
    revenue = Column(Float, default=0.0)
    status = Column(String(50), default="Draft")  # Draft, Dispatched, Completed, Cancelled

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    description = Column(String(255), nullable=False)
    cost = Column(Float, default=0.0)
    status = Column(String(50), default="Active")  # Active, Closed
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, nullable=True)  # Optional link to a specific trip
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    category = Column(String(100), nullable=False)  # Toll, Maintenance, Fuel, Other
    cost = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String(255), nullable=True)

    vehicle = relationship("Vehicle", back_populates="expenses")
