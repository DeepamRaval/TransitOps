from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login():
    return {"message": "Placeholder Auth: Login endpoint"}

@router.post("/signup")
def signup():
    return {"message": "Placeholder Auth: Signup endpoint"}
