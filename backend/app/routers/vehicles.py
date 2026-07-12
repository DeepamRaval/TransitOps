from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

@router.get("/")
def get_vehicles(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Vehicle)
    if status:
        query = query.filter(models.Vehicle.status == status)
    return query.all()

@router.post("/")
def create_vehicle():
    return {"message": "Placeholder Vehicle: Create vehicle endpoint"}
