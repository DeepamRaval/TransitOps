from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict, Any, List
from ..database import get_db
from ..models import Vehicle, FuelLog, Expense, Trip
from ..schemas import FuelLogCreate, ExpenseCreate

router = APIRouter()

@router.get("/logs")
def get_expense_logs(db: Session = Depends(get_db)):
    fuel_count = db.query(FuelLog).count()
    expense_count = db.query(Expense).count()
    
    # Fallback to Excalidraw mockup lists if database contains no records
    if fuel_count == 0 and expense_count == 0:
        return {
            "fuel_logs": [
                {"vehicle": "VAN-05", "date": "2026-07-05", "liters": 42.0, "cost": 3150.0},
                {"vehicle": "TRUCK-11", "date": "2026-07-06", "liters": 110.0, "cost": 8400.0},
                {"vehicle": "MINI-08", "date": "2026-07-06", "liters": 28.0, "cost": 2050.0}
            ],
            "other_expenses": [
                {"trip": "TR001", "vehicle": "VAN-05", "toll": 120.0, "other": 0.0, "maint": 0.0, "total": 120.0, "status": "Available"},
                {"trip": "TR002", "vehicle": "TRK-12", "toll": 340.0, "other": 150.0, "maint": 18000.0, "total": 18490.0, "status": "Completed"}
            ],
            "total_operational_cost": 34070.0
        }
    
    # Process PostgreSQL entries
    fuel_db = db.query(FuelLog).order_by(FuelLog.date.desc()).all()
    expenses_db = db.query(Expense).order_by(Expense.date.desc()).all()
    
    fuel_logs = []
    total_fuel_cost = 0.0
    for f in fuel_db:
        v = db.query(Vehicle).filter(Vehicle.id == f.vehicle_id).first()
        fuel_logs.append({
            "vehicle": v.registration_number if v else "--",
            "date": f.date.isoformat(),
            "liters": f.liters,
            "cost": f.cost
        })
        total_fuel_cost += f.cost
        
    other_expenses = []
    total_other_cost = 0.0
    for e in expenses_db:
        v = db.query(Vehicle).filter(Vehicle.id == e.vehicle_id).first()
        t = db.query(Trip).filter(Trip.vehicle_id == e.vehicle_id, Trip.status == "Completed").first()
        
        toll = e.cost if e.category == "Toll" else 0.0
        other = e.cost if e.category == "Other" else 0.0
        maint = e.cost if e.category == "Maintenance" else 0.0
        total_row = toll + other + maint
        
        other_expenses.append({
            "trip": f"TR{t.id:03d}" if t else "GEN",
            "vehicle": v.registration_number if v else "--",
            "toll": toll,
            "other": other,
            "maint": maint,
            "total": total_row,
            "status": t.status if t else "Completed"
        })
        total_other_cost += total_row
        
    return {
        "fuel_logs": fuel_logs,
        "other_expenses": other_expenses,
        "total_operational_cost": total_fuel_cost + total_other_cost
    }

@app_post_fuel := router.post("/fuel")
def create_fuel_log(payload: FuelLogCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    db_log = FuelLog(
        vehicle_id=payload.vehicle_id,
        trip_id=payload.trip_id,
        liters=payload.liters,
        cost=payload.cost,
        date=payload.date
    )
    db.add(db_log)
    
    # Also log as an expense category
    db_expense = Expense(
        vehicle_id=payload.vehicle_id,
        category="Fuel",
        cost=payload.cost,
        date=payload.date,
        description=f"Fuel log: {payload.liters} liters"
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_log)
    return db_log

@app_post_expense := router.post("/general")
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    db_expense = Expense(
        vehicle_id=payload.vehicle_id,
        category=payload.category,
        cost=payload.cost,
        date=payload.date,
        description=payload.description
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense
