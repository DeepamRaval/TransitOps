from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

@router.get("/")
def get_drivers(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Driver)
    if status:
        query = query.filter(models.Driver.status == status)
    return query.all()

@router.post("/")
def create_driver():
    return {"message": "Placeholder Driver: Create driver endpoint"}
