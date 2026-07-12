from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, vehicles, drivers, trips, maintenance, expenses, dashboard, reports

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TransitOps API Gateway",
    description="FastAPI REST Backend for Smart Transport Operations",
    version="1.0.0"
)

# Enable CORS for the local Vite React frontend (port 5173 or other local hosts)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core domain routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
def hello_world():
    return {"message": "Hello World from TransitOps Backend Blueprint!"}
