from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_vehicles():
    return []

@router.post("/")
def create_vehicle():
    return {"message": "Placeholder Vehicle: Create vehicle endpoint"}
