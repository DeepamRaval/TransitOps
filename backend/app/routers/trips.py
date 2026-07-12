from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_trips():
    return []

@router.post("/")
def create_trip():
    return {"message": "Placeholder Trip: Create trip endpoint"}
