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
        # Other roles can view all or filter by driver_id
        if driver_id:
            query = query.filter(Trip.driver_id == driver_id)

    if vehicle_id:
        query = query.filter(Trip.vehicle_id == vehicle_id)

    if status:
        if status not in TRIP_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Use: {', '.join(TRIP_STATUSES)}",
            )
        query = query.filter(Trip.status == status)

    return query.order_by(Trip.id.desc()).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    user: Authenticated,
    db: Annotated[Session, Depends(get_db)],
):
    trip = _get_trip_or_404(trip_id, db)
    if user.role == "Driver":
        driver_record = db.query(Driver).filter(Driver.name == user.name).first()
        if not driver_record or trip.driver_id != driver_record.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own assigned trips",
            )
    return trip


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    _: FleetManager,
    db: Annotated[Session, Depends(get_db)],
):
    # 1. Validate vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # 2. Validate driver exists
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    # 3. Check vehicle availability (only if trip status is active/scheduled)
    if payload.status not in ("Draft", "Cancelled") and vehicle.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle {vehicle.registration_number} is not available (Status: {vehicle.status})",
        )

    # 4. Check driver availability and license expiration
    if payload.status not in ("Draft", "Cancelled"):
        if driver.status != "Available":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver {driver.name} is not available (Status: {driver.status})",
            )
        if driver.license_expiry_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver {driver.name} has an expired license",
            )

    # 5. Create trip
    trip = Trip(**payload.model_dump())
    db.add(trip)

    # 6. If trip starts in "In Transit" status, set vehicle & driver to "On Trip"
    if payload.status == "In Transit":
        vehicle.status = "On Trip"
        driver.status = "On Trip"

    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    user: Authenticated,
    db: Annotated[Session, Depends(get_db)],
):
    trip = _get_trip_or_404(trip_id, db)

    # Permissions checks
    if user.role == "Driver":
        # Check if assigned
        driver_record = db.query(Driver).filter(Driver.name == user.name).first()
        if not driver_record or trip.driver_id != driver_record.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this trip",
            )
        # Drivers can only update status, actual_distance, and fuel_consumed
        allowed_fields = {"status", "actual_distance", "fuel_consumed"}
        provided_fields = payload.model_dump(exclude_unset=True)
        if not set(provided_fields.keys()).issubset(allowed_fields):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Drivers can only update status, actual distance, and fuel consumed",
            )
    elif user.role != "Fleet Manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Fleet Managers or the assigned Driver can update this trip",
        )

    prev_status = trip.status

    # Apply updates
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(trip, field, value)

    # Handle transitions
    if trip.status != prev_status:
        if trip.status not in TRIP_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {trip.status}",
            )

        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        # In Transit
        if trip.status == "In Transit":
            if vehicle:
                vehicle.status = "On Trip"
            if driver:
                driver.status = "On Trip"

        # Completed
        elif trip.status == "Completed":
            if vehicle:
                vehicle.status = "Available"
                # Add actual distance (fallback to planned) to odometer
                dist = trip.actual_distance if trip.actual_distance is not None else trip.planned_distance
                if dist:
                    vehicle.odometer = (vehicle.odometer or 0.0) + dist
            if driver:
                driver.status = "Available"

        # Cancelled
        elif trip.status == "Cancelled":
            if prev_status == "In Transit":
                if vehicle:
                    vehicle.status = "Available"
                if driver:
                    driver.status = "Available"

        # Reverted to Scheduled/Draft
        elif trip.status in ("Scheduled", "Draft") and prev_status == "In Transit":
            if vehicle:
                vehicle.status = "Available"
            if driver:
                driver.status = "Available"

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    _: FleetManager,
    db: Annotated[Session, Depends(get_db)],
):
    trip = _get_trip_or_404(trip_id, db)

    # Release assets if active
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
