from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import schemas
from ..services import maintenance_service

router = APIRouter()

@router.get("/", response_model=List[schemas.MaintenanceResponse])
def read_maintenance_logs(status: Optional[str] = None, db: Session = Depends(get_db)):
    return maintenance_service.get_maintenance_logs(db, status_filter=status)

@router.get("/{log_id}", response_model=schemas.MaintenanceResponse)
def read_maintenance_log(log_id: int, db: Session = Depends(get_db)):
    return maintenance_service.get_maintenance_log(db, log_id)

@router.post("/", response_model=schemas.MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(maint_in: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    return maintenance_service.create_maintenance_log(db, maint_in)

@router.put("/{log_id}/close", response_model=schemas.MaintenanceResponse)
def close_maintenance_log(log_id: int, close_in: schemas.MaintenanceClose, db: Session = Depends(get_db)):
    return maintenance_service.close_maintenance_log(db, log_id, cost=close_in.cost, end_date=close_in.end_date)

@router.delete("/{log_id}")
def delete_maintenance_log(log_id: int, db: Session = Depends(get_db)):
    return maintenance_service.delete_maintenance_log(db, log_id)
