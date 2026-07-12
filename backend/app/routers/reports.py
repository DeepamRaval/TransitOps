from fastapi import APIRouter

router = APIRouter()

@router.get("/roi")
def get_roi_report():
    return []

@router.get("/efficiency")
def get_efficiency_report():
    return []
