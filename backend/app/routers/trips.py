from typing import Annotated, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..enums import TRIP_STATUSES, TripStatus
from ..models import User, Vehicle, Driver, Trip
from ..schemas import TripCreate, TripUpdate, TripResponse
from ..services import trip_service

router = APIRouter()

FleetManager = Annotated[User, Depends(require_roles("Fleet Manager"))]
Authenticated = Annotated[User, Depends(get_current_user)]


@router.get("/", response_model=list[TripResponse])
def list_trips(
    user: Authenticated,
    db: Annotated[Session, Depends(get_db)],
    status: Optional[str] = Query(default=None, description="Filter by status"),
    driver_id: Optional[int] = Query(default=None, description="Filter by driver ID"),
    vehicle_id: Optional[int] = Query(default=None, description="Filter by vehicle ID"),
):
    query = db.query(Trip)

    # Drivers can only see their own assigned trips
    if user.role == "Driver":
        driver_record = db.query(Driver).filter(Driver.name == user.name).first()
        if not driver_record:
            return []
        query = query.filter(Trip.driver_id == driver_record.id)
    else:
        # Others can filter
        if driver_id is not None:
            query = query.filter(Trip.driver_id == driver_id)
        if vehicle_id is not None:
            query = query.filter(Trip.vehicle_id == vehicle_id)

    if status:
        if status not in TRIP_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be: {', '.join(TRIP_STATUSES)}"
            )
        query = query.filter(Trip.status == status)

    return query.order_by(Trip.id.desc()).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    user: Authenticated,
    db: Annotated[Session, Depends(get_db)]
):
    trip = trip_service.get_trip(db, trip_id)
    if user.role == "Driver":
        driver_record = db.query(Driver).filter(Driver.name == user.name).first()
        if not driver_record or trip.driver_id != driver_record.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return trip


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    _: FleetManager,
    db: Annotated[Session, Depends(get_db)]
):
    # Delegates to service layer which validates:
    # - Vehicle exists and is Available (not On Trip, In Shop, or Retired)
    # - Cargo weight <= vehicle max_load_capacity
    # - Driver exists, is Available, not Suspended/Off Duty/On Trip
    # - Driver license is not expired
    return trip_service.create_trip(db, payload)


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    user: Authenticated,
    db: Annotated[Session, Depends(get_db)]
):
    trip = trip_service.get_trip(db, trip_id)

    # Validate RBAC: Drivers can only update status, actual_distance, and fuel_consumed of their assigned trip
    if user.role == "Driver":
        driver_record = db.query(Driver).filter(Driver.name == user.name).first()
        if not driver_record or trip.driver_id != driver_record.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        # Ensure Driver is only updating allowed fields
        payload_dict = payload.model_dump(exclude_unset=True)
        allowed_fields = {"status", "actual_distance", "fuel_consumed"}
        extra_fields = set(payload_dict.keys()) - allowed_fields
        if extra_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Drivers are not allowed to update fields: {', '.join(extra_fields)}"
            )

    # Business Logic: handle status transitions via service layer
    new_status = payload.status
    if new_status and new_status != trip.status:
        if new_status == "Dispatched":
            # Service validates: trip must be Draft, vehicle & driver must be Available, license valid
            return trip_service.dispatch_trip(db, trip_id)

        elif new_status == "Completed":
            # Service validates: trip must be Dispatched, updates odometer, creates fuel/expense logs
            actual_dist = payload.actual_distance if payload.actual_distance is not None else trip.planned_distance
            fuel_consumed = payload.fuel_consumed if payload.fuel_consumed is not None else 0.0
            fuel_cost = fuel_consumed * 100.0  # default cost estimate
            return trip_service.complete_trip(db, trip_id, actual_dist, fuel_consumed, fuel_cost)

        elif new_status == "Cancelled":
            # Service validates: trip cannot already be Completed/Cancelled, releases assets if Dispatched
            return trip_service.cancel_trip(db, trip_id)

    # For non-status-transition updates (e.g., editing cargo_weight, source, destination on a Draft trip)
    if trip.status != "Draft" and user.role != "Fleet Manager":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft trips can be edited"
        )

    update_data = payload.model_dump(exclude_unset=True)
    # Remove status from update_data since we handle it above
    update_data.pop("status", None)

    # If vehicle_id or driver_id is changing, re-validate
    new_vehicle_id = update_data.get("vehicle_id")
    new_cargo_weight = update_data.get("cargo_weight", trip.cargo_weight)

    if new_vehicle_id and new_vehicle_id != trip.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == new_vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=400, detail="Vehicle not found")
        if vehicle.status != "Available":
            raise HTTPException(status_code=400, detail=f"Vehicle is currently {vehicle.status} and cannot be assigned")
        if new_cargo_weight > vehicle.max_load_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Cargo weight ({new_cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_load_capacity} kg)"
            )
    elif "cargo_weight" in update_data:
        # Cargo weight changed but vehicle didn't — still need to check against current vehicle
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        if vehicle and new_cargo_weight > vehicle.max_load_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Cargo weight ({new_cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_load_capacity} kg)"
            )

    new_driver_id = update_data.get("driver_id")
    if new_driver_id and new_driver_id != trip.driver_id:
        driver = db.query(Driver).filter(Driver.id == new_driver_id).first()
        if not driver:
            raise HTTPException(status_code=400, detail="Driver not found")
        if driver.status != "Available":
            raise HTTPException(status_code=400, detail=f"Driver is currently {driver.status} and cannot be assigned")
        if driver.license_expiry_date and driver.license_expiry_date < date.today():
            raise HTTPException(status_code=400, detail="Driver's license is expired")

    for key, value in update_data.items():
        setattr(trip, key, value)

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    _: FleetManager,
    db: Annotated[Session, Depends(get_db)]
):
    trip = trip_service.get_trip(db, trip_id)

    # Release vehicle and driver if deleting an active dispatched trip
    if trip.status == "Dispatched":
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        if vehicle:
            vehicle.status = "Available"
        if driver:
            driver.status = "Available"

    db.delete(trip)
    db.commit()
    return None
