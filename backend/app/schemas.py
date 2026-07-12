from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str

class UserCreate(UserBase):
    password: str
    otp: str

class UserResponse(UserBase):
    id: int
    email_verified: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SendOtpRequest(BaseModel):
    email: EmailStr
    purpose: str  # register | reset_password

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# --- Vehicle Schemas ---
class VehicleBase(BaseModel):
    registration_number: str
    name_model: str
    type: str
    max_load_capacity: float
    odometer: Optional[float] = 0.0
    acquisition_cost: float
    status: Optional[str] = "Available"
    region: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True


# --- Driver Schemas ---
class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: Optional[float] = 100.0
    status: Optional[str] = "Available"

class DriverCreate(DriverBase):
    pass

class DriverResponse(DriverBase):
    id: int

    class Config:
        from_attributes = True


# --- Trip Schemas ---
class TripBase(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: Optional[float] = 0.0
    status: Optional[str] = "Draft"

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int

    class Config:
        from_attributes = True


# --- Maintenance Schemas ---
class MaintenanceBase(BaseModel):
    vehicle_id: int
    description: str
    cost: Optional[float] = 0.0
    status: Optional[str] = "Active"
    start_date: date
    end_date: Optional[date] = None

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceResponse(MaintenanceBase):
    id: int

    class Config:
        from_attributes = True


# --- Fuel Log Schemas ---
class FuelLogBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    date: date

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogResponse(FuelLogBase):
    id: int

    class Config:
        from_attributes = True


# --- Expense Schemas ---
class ExpenseBase(BaseModel):
    vehicle_id: int
    category: str
    cost: float
    date: date
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True


# --- Dashboard & Reports Schemas ---
class DashboardKPIs(BaseModel):
    active_vehicles: int
    available_vehicles: int
    in_maintenance_vehicles: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_percent: float

class VehicleProfitability(BaseModel):
    vehicle_id: int
    registration_number: str
    name_model: str
    total_revenue: float
    total_operational_cost: float
    roi_percent: float
