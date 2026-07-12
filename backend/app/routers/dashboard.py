from fastapi import APIRouter

router = APIRouter()

@router.get("/kpis")
def get_kpis():
    return {
        "active_vehicles": 0,
        "available_vehicles": 0,
        "in_maintenance_vehicles": 0,
        "active_trips": 0,
        "pending_trips": 0,
        "drivers_on_duty": 0,
        "fleet_utilization_percent": 0.0
    }
