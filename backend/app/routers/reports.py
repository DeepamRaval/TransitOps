from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..database import get_db
from ..models import Vehicle, FuelLog, Expense, Trip

router = APIRouter()

@router.get("/analytics")
def get_analytics_report(db: Session = Depends(get_db)):
    vehicle_count = db.query(Vehicle).count()
    
    # Fallback to Excalidraw mockup values if database is empty
    if vehicle_count == 0:
        return {
            "fuel_efficiency": "8.4 km/l",
            "fleet_utilization_percent": "81%",
            "operational_cost": "34,070",
            "vehicle_roi_percent": "14.2%",
            "monthly_revenue": [
                {"month": "Jan", "revenue": 10000},
                {"month": "Feb", "revenue": 15000},
                {"month": "Mar", "revenue": 12000},
                {"month": "Apr", "revenue": 18000},
                {"month": "May", "revenue": 16000},
                {"month": "Jun", "revenue": 22000},
                {"month": "Jul", "revenue": 20000}
            ],
            "costliest_vehicles": [
                {"name": "TRUCK-11", "cost": 25000},
                {"name": "MINI-03", "cost": 15000},
                {"name": "VAN-05", "cost": 5000}
            ]
        }
    
    # Process PostgreSQL values
    vehicles = db.query(Vehicle).all()
    active_vehicles = [v for v in vehicles if v.status != "Retired"]
    
    # Calculate Utilization
    utilization_str = "0%"
    if len(active_vehicles) > 0:
        on_trip = len([v for v in active_vehicles if v.status == "On Trip"])
        utilization_str = f"{int((on_trip / len(active_vehicles)) * 100)}%"
        
    # Calculate Total Expenses
    fuel_cost = sum([f.cost for f in db.query(FuelLog).all()])
    maint_cost = sum([e.cost for e in db.query(Expense).filter(Expense.category == "Maintenance").all()])
    other_cost = sum([e.cost for e in db.query(Expense).filter(Expense.category.in_(["Toll", "Other"])).all()])
    total_operational_cost = fuel_cost + maint_cost + other_cost
    
    # Calculate Fuel Efficiency (km / L)
    trips = db.query(Trip).filter(Trip.status == "Completed").all()
    total_distance = sum([t.actual_distance for t in trips if t.actual_distance])
    total_liters = sum([t.fuel_consumed for t in trips if t.fuel_consumed])
    
    fuel_efficiency_str = "0.0 km/l"
    if total_liters > 0:
        fuel_efficiency_str = f"{round(total_distance / total_liters, 1)} km/l"
        
    # Calculate Total ROI
    total_revenue = sum([t.revenue for t in trips])
    total_acquisition = sum([v.acquisition_cost for v in vehicles if v.acquisition_cost > 0])
    
    roi_str = "0.0%"
    if total_acquisition > 0:
        roi = ((total_revenue - (maint_cost + fuel_cost)) / total_acquisition) * 100
        roi_str = f"{round(roi, 1)}%"
        
    # Monthly Revenue Chart
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_rev = []
    for i, month in enumerate(months):
        month_trips = [
            t for t in trips 
            if t.actual_distance and t.actual_distance > 0 and t.start_date and t.start_date.month == (i + 1)
        ]
        month_rev = sum([t.revenue for t in month_trips])
        monthly_rev.append({"month": month, "revenue": month_rev if month_rev > 0 else 0})
        
    # Top Costliest Vehicles Chart (Operational costs per vehicle)
    vehicle_costs = []
    for v in vehicles:
        v_fuel = sum([f.cost for f in db.query(FuelLog).filter(FuelLog.vehicle_id == v.id).all()])
        v_expense = sum([e.cost for e in db.query(Expense).filter(Expense.vehicle_id == v.id).all()])
        total_v_cost = v_fuel + v_expense
        if total_v_cost > 0:
            vehicle_costs.append({"name": v.registration_number, "cost": total_v_cost})
            
    vehicle_costs = sorted(vehicle_costs, key=lambda x: x["cost"], reverse=True)[:5]
    if not vehicle_costs:
        vehicle_costs = [{"name": "No Data", "cost": 0}]
        
    return {
        "fuel_efficiency": fuel_efficiency_str,
        "fleet_utilization_percent": utilization_str,
        "operational_cost": f"{total_operational_cost:,.0f}",
        "vehicle_roi_percent": roi_str,
        "monthly_revenue": monthly_rev[:7], # limit to 7 for visual chart sizing
        "costliest_vehicles": vehicle_costs
    }
