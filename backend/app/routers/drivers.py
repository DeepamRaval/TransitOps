from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_drivers():
    return []

@router.post("/")
def create_driver():
    return {"message": "Placeholder Driver: Create driver endpoint"}
