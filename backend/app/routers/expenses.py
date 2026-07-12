from fastapi import APIRouter

router = APIRouter()

@router.get("/fuel")
def get_fuel_logs():
    return []

@router.get("/general")
def get_expenses():
    return []
