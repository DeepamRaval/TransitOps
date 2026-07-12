from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date
from .. import models, schemas

def get_maintenance_logs(db: Session, status_filter: str = None):
    query = db.query(models.MaintenanceLog)
    if status_filter:
        query = query.filter(models.MaintenanceLog.status == status_filter)
    return query.all()

def get_maintenance_log(db: Session, log_id: int):
    log = db.query(models.MaintenanceLog).filter(models.MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance log not found")
    return log

def create_maintenance_log(db: Session, maint_in: schemas.MaintenanceCreate):
    # Fetch vehicle
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == maint_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    if vehicle.status == "Retired":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot open maintenance log for a Retired vehicle"
        )

    # Create active maintenance log
    db_log = models.MaintenanceLog(
        vehicle_id=maint_in.vehicle_id,
        description=maint_in.description,
        cost=maint_in.cost or 0.0,
        status="Active",
        start_date=maint_in.start_date,
        end_date=None
    )
    db.add(db_log)

    # Set vehicle status to "In Shop"
    vehicle.status = "In Shop"

    db.commit()
    db.refresh(db_log)
    return db_log

def close_maintenance_log(db: Session, log_id: int, cost: float, end_date: date):
    log = get_maintenance_log(db, log_id)
    if log.status == "Closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maintenance log is already closed"
        )

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == log.vehicle_id).first()

    # Update log details
    log.status = "Closed"
    log.cost = cost
    log.end_date = end_date

    # Restore vehicle status to Available (unless retired)
    if vehicle and vehicle.status != "Retired":
        vehicle.status = "Available"

    # Automatically create a Maintenance Expense entry
    expense = models.Expense(
        vehicle_id=log.vehicle_id,
        category="Maintenance",
        cost=cost,
        date=end_date,
        description=f"Maintenance Closed: {log.description}"
    )
    db.add(expense)

    db.commit()
    db.refresh(log)
    return log

def delete_maintenance_log(db: Session, log_id: int):
    log = get_maintenance_log(db, log_id)
    
    # If deleting an active maintenance, restore vehicle status
    if log.status == "Active":
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == log.vehicle_id).first()
        if vehicle and vehicle.status == "In Shop":
            vehicle.status = "Available"

    db.delete(log)
    db.commit()
    return {"detail": "Maintenance log deleted successfully"}
