from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime, timedelta
from typing import Optional, List

from .enums import DRIVER_STATUSES, VEHICLE_STATUSES, VehicleStatus, DriverStatus, TripStatus

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str

class UserCreate(UserBase):
    password: str
    otp: Optional[str] = None

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
    registration_number: str = Field(..., min_length=1, max_length=100)
    name_model: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=100)
    max_load_capacity: float = Field(..., gt=0)
    odometer: float = Field(default=0.0, ge=0)
    acquisition_cost: float = Field(..., ge=0)
    status: VehicleStatus = "Available"
    region: Optional[str] = Field(default=None, max_length=100)

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = Field(default=None, min_length=1, max_length=100)
    name_model: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    max_load_capacity: Optional[float] = Field(default=None, gt=0)
    odometer: Optional[float] = Field(default=None, ge=0)
    acquisition_cost: Optional[float] = Field(default=None, ge=0)
    status: Optional[VehicleStatus] = None
    region: Optional[str] = Field(default=None, max_length=100)

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True


# --- Driver Schemas ---
def _license_flags(expiry: date) -> tuple[bool, bool]:
    today = date.today()
    return expiry < today, expiry <= today + timedelta(days=30)


class DriverBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    license_number: str = Field(..., min_length=1, max_length=100)
    license_category: str = Field(..., min_length=1, max_length=50)
    license_expiry_date: date
    contact_number: str = Field(..., min_length=1, max_length=50)
    safety_score: float = Field(default=100.0, ge=0, le=100)
    status: DriverStatus = "Available"

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    license_number: Optional[str] = Field(default=None, min_length=1, max_length=100)
    license_category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = Field(default=None, min_length=1, max_length=50)
    safety_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: Optional[DriverStatus] = None

class DriverResponse(DriverBase):
    id: int
    license_expired: bool = False
    license_expiring_soon: bool = False

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_flags(cls, driver) -> "DriverResponse":
        expired, expiring = _license_flags(driver.license_expiry_date)
        return cls(
            id=driver.id,
            name=driver.name,
            email=driver.email,
            license_number=driver.license_number,
            license_category=driver.license_category,
            license_expiry_date=driver.license_expiry_date,
            contact_number=driver.contact_number,
            safety_score=driver.safety_score,
            status=driver.status,
            license_expired=expired,
            license_expiring_soon=expiring and not expired,
        )


# --- Trip Schemas ---
class TripBase(BaseModel):
    source: str = Field(..., min_length=1, max_length=255)
    destination: str = Field(..., min_length=1, max_length=255)
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(..., gt=0)
    planned_distance: float = Field(..., gt=0)
    actual_distance: Optional[float] = Field(default=None, ge=0)
    fuel_consumed: Optional[float] = Field(default=None, ge=0)
    revenue: float = Field(default=0.0, ge=0)
    status: TripStatus = "Draft"

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    source: Optional[str] = Field(default=None, min_length=1, max_length=255)
    destination: Optional[str] = Field(default=None, min_length=1, max_length=255)
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    cargo_weight: Optional[float] = Field(default=None, gt=0)
    planned_distance: Optional[float] = Field(default=None, gt=0)
    actual_distance: Optional[float] = Field(default=None, ge=0)
    fuel_consumed: Optional[float] = Field(default=None, ge=0)
    revenue: Optional[float] = Field(default=None, ge=0)
    status: Optional[TripStatus] = None

class TripStatusUpdate(BaseModel):
    status: TripStatus
    actual_distance: Optional[float] = Field(default=None, ge=0)
    fuel_consumed: Optional[float] = Field(default=None, ge=0)

class TripResponse(TripBase):
    id: int
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[DriverResponse] = None

    class Config:
        from_attributes = True

class TripComplete(BaseModel):
    actual_distance: float
    fuel_consumed: float
    fuel_cost: float


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

class MaintenanceClose(BaseModel):
    cost: float
    end_date: date


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
