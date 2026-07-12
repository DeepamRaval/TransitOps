from typing import Annotated, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..enums import TRIP_STATUSES, TripStatus
from ..models import User, Vehicle, Driver, Trip
from ..schemas import TripCreate, TripUpdate, TripResponse

router = APIRouter()

FleetManager = Annotated[User, Depends(require_roles("Fleet Manager"))]
Authenticated = Annotated[User, Depends(get_current_user)]


def _get_trip_or_404(trip_id: int, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


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
                status_code=status.HTTP_400_BAD_REQUEST,
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
    trip = _get_trip_or_404(trip_id, db)
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
    # Verify vehicle exists and is Available
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle not found")
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is currently {vehicle.status} and cannot be assigned"
        )

    # Verify driver exists, has an active license (not expired), and is Available
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver not found")
    if driver.license_expiry_date and driver.license_expiry_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver's license is expired")
    if driver.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver is currently {driver.status} and cannot be assigned"
        )

    trip = Trip(**payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    user: Authenticated,
    db: Annotated[Session, Depends(get_db)]
):
    trip = _get_trip_or_404(trip_id, db)

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

    # Business Logic state transitions
    new_status = payload.status
    if new_status and new_status != trip.status:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        if new_status == "In Transit":
            # Vehicle and Driver go to On Trip
            if vehicle:
                vehicle.status = "On Trip"
            if driver:
                driver.status = "On Trip"

        elif new_status in ["Completed", "Cancelled"]:
            # Vehicle and Driver go back to Available
            if vehicle:
                vehicle.status = "Available"
            if driver:
                driver.status = "Available"

            # Odometer calculation on Complete
            if new_status == "Completed" and vehicle:
                dist = payload.actual_distance if payload.actual_distance is not None else trip.planned_distance
                if dist is not None:
                    vehicle.odometer += dist

    # Apply updates
    update_data = payload.model_dump(exclude_unset=True)
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
    trip = _get_trip_or_404(trip_id, db)

    # Release vehicle and driver if deleting active trip
    if trip.status == "In Transit":
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        if vehicle:
            vehicle.status = "Available"
        if driver:
            driver.status = "Available"

    db.delete(trip)
    db.commit()
    return None
