from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..enums import VEHICLE_STATUSES
from ..models import User, Vehicle
from ..schemas import VehicleCreate, VehicleResponse, VehicleUpdate

router = APIRouter()

FleetManager = Annotated[User, Depends(require_roles("Fleet Manager"))]
Authenticated = Annotated[User, Depends(get_current_user)]


def _get_vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(
    _: Authenticated,
    db: Annotated[Session, Depends(get_db)],
    status: Optional[str] = Query(default=None, description="Filter by status"),
    type: Optional[str] = Query(default=None, description="Filter by vehicle type"),
    region: Optional[str] = Query(default=None, description="Filter by region"),
):
    query = db.query(Vehicle)
    if status:
        if status not in VEHICLE_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Use: {', '.join(VEHICLE_STATUSES)}")
        query = query.filter(Vehicle.status == status)
    if type:
        query = query.filter(Vehicle.type.ilike(type))
    if region:
        query = query.filter(Vehicle.region.ilike(region))
    return query.order_by(Vehicle.registration_number).all()


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, _: Authenticated, db: Annotated[Session, Depends(get_db)]):
    return _get_vehicle_or_404(vehicle_id, db)


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, _: FleetManager, db: Annotated[Session, Depends(get_db)]):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration number already exists",
        ) from exc
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    _: FleetManager,
    db: Annotated[Session, Depends(get_db)],
):
    vehicle = _get_vehicle_or_404(vehicle_id, db)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(vehicle, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration number already exists",
        ) from exc
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, _: FleetManager, db: Annotated[Session, Depends(get_db)]):
    vehicle = _get_vehicle_or_404(vehicle_id, db)
    db.delete(vehicle)
    db.commit()
    return None
