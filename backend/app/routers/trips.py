from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import schemas
from ..services import trip_service

router = APIRouter()

@router.get("/", response_model=List[schemas.TripResponse])
def read_trips(status: Optional[str] = None, db: Session = Depends(get_db)):
    return trip_service.get_trips(db, status_filter=status)

@router.get("/{trip_id}", response_model=schemas.TripResponse)
def read_trip(trip_id: int, db: Session = Depends(get_db)):
    return trip_service.get_trip(db, trip_id)

@router.post("/", response_model=schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip_in: schemas.TripCreate, db: Session = Depends(get_db)):
    # Standard status code is 201. Let's explicitly set status_code=status.HTTP_201_CREATED
    return trip_service.create_trip(db, trip_in)

@router.put("/{trip_id}/dispatch", response_model=schemas.TripResponse)
def dispatch_trip(trip_id: int, db: Session = Depends(get_db)):
    return trip_service.dispatch_trip(db, trip_id)

@router.put("/{trip_id}/complete", response_model=schemas.TripResponse)
def complete_trip(trip_id: int, complete_in: schemas.TripComplete, db: Session = Depends(get_db)):
    return trip_service.complete_trip(
        db, 
        trip_id, 
        actual_distance=complete_in.actual_distance, 
        fuel_consumed=complete_in.fuel_consumed, 
        fuel_cost=complete_in.fuel_cost
    )

@router.put("/{trip_id}/cancel", response_model=schemas.TripResponse)
def cancel_trip(trip_id: int, db: Session = Depends(get_db)):
    return trip_service.cancel_trip(db, trip_id)

@router.delete("/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    return trip_service.delete_trip(db, trip_id)
