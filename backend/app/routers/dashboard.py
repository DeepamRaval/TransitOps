from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, Vehicle, Driver, Trip

router = APIRouter()

Authenticated = Annotated[User, Depends(get_current_user)]


@router.get("/kpis")
def get_kpis(_: Authenticated, db: Annotated[Session, Depends(get_db)]):
    total_vehicles = db.query(Vehicle).filter(Vehicle.status != "Retired").count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.status == "On Trip").count()
    available_vehicles = db.query(Vehicle).filter(Vehicle.status == "Available").count()
    in_maintenance_vehicles = db.query(Vehicle).filter(Vehicle.status == "In Shop").count()

    active_trips = db.query(Trip).filter(Trip.status == "In Transit").count()
    pending_trips = db.query(Trip).filter(Trip.status == "Scheduled").count()

    drivers_on_duty = db.query(Driver).filter(Driver.status.in_(["Available", "On Trip"])).count()

    fleet_utilization = 0.0
    if total_vehicles > 0:
        fleet_utilization = round((active_vehicles / total_vehicles) * 100, 1)

    return {
        "active_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "in_maintenance_vehicles": in_maintenance_vehicles,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization_percent": fleet_utilization,
    }
