from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date
from .. import models, schemas

def get_trips(db: Session, status_filter: str = None):
    query = db.query(models.Trip)
    if status_filter:
        query = query.filter(models.Trip.status == status_filter)
    return query.all()

def get_trip(db: Session, trip_id: int):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip

def create_trip(db: Session, trip_in: schemas.TripCreate):
    # Fetch vehicle
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    
    # Validation: Retired or In Shop vehicles must never appear in dispatch selection (or be assigned)
    if vehicle.status in ["In Shop", "Retired"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is not available for assignment (Status: {vehicle.status})"
        )
    if vehicle.status == "On Trip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is already assigned to another active trip"
        )
        
    # Validation: Cargo weight must not exceed vehicle's max capacity
    if trip_in.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo weight ({trip_in.cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_load_capacity} kg)"
        )

    # Fetch driver
    driver = db.query(models.Driver).filter(models.Driver.id == trip_in.driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        
    # Validation: Suspended driver cannot be assigned
    if driver.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is suspended and cannot be assigned to trips"
        )
    if driver.status == "On Trip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is already assigned to another active trip"
        )
    if driver.status == "Off Duty":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver is off duty and cannot be assigned to trips"
        )
        
    # Validation: Expired driver license cannot be assigned
    if driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver's license has expired and cannot be assigned to trips"
        )

    # Create the Trip in Draft state
    db_trip = models.Trip(
        source=trip_in.source,
        destination=trip_in.destination,
        vehicle_id=trip_in.vehicle_id,
        driver_id=trip_in.driver_id,
        cargo_weight=trip_in.cargo_weight,
        planned_distance=trip_in.planned_distance,
        revenue=trip_in.revenue or 0.0,
        status="Draft"
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

def dispatch_trip(db: Session, trip_id: int):
    trip = get_trip(db, trip_id)
    if trip.status != "Draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Draft trips can be dispatched (Current status: {trip.status})"
        )

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()

    if not vehicle or not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle or Driver associated with this trip could not be found"
        )

    # Double check availability at time of dispatch
    if vehicle.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle is no longer available (Status: {vehicle.status})"
        )
    if driver.status != "Available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver is no longer available (Status: {driver.status})"
        )
    if driver.license_expiry_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver's license has expired since creation of the draft"
        )

    # Wrap status changes in transaction
    trip.status = "Dispatched"
    vehicle.status = "On Trip"
    driver.status = "On Trip"

    db.commit()
    db.refresh(trip)
    return trip

def complete_trip(db: Session, trip_id: int, actual_distance: float, fuel_consumed: float, fuel_cost: float):
    trip = get_trip(db, trip_id)
    if trip.status != "Dispatched":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only Dispatched trips can be completed (Current status: {trip.status})"
        )

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
    driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()

    # Update trip details
    trip.status = "Completed"
    trip.actual_distance = actual_distance
    trip.fuel_consumed = fuel_consumed

    # Update vehicle odometer and restore availability status
    if vehicle:
        vehicle.odometer = (vehicle.odometer or 0.0) + actual_distance
        if vehicle.status != "Retired":
            vehicle.status = "Available"

    # Restore driver status
    if driver:
        if driver.status != "Suspended":
            driver.status = "Available"

    # Automatically create a Fuel Log
    fuel_log = models.FuelLog(
        vehicle_id=trip.vehicle_id,
        trip_id=trip.id,
        liters=fuel_consumed,
        cost=fuel_cost,
        date=date.today()
    )
    db.add(fuel_log)

    # Automatically create a Fuel Expense
    expense = models.Expense(
        vehicle_id=trip.vehicle_id,
        category="Fuel",
        cost=fuel_cost,
        date=date.today(),
        description=f"Fuel for trip #{trip.id} ({actual_distance} km completed)"
    )
    db.add(expense)

    db.commit()
    db.refresh(trip)
    return trip

def cancel_trip(db: Session, trip_id: int):
    trip = get_trip(db, trip_id)
    if trip.status in ["Completed", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip already {trip.status} and cannot be cancelled"
        )

    # If dispatched, we need to release the vehicle and driver
    if trip.status == "Dispatched":
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == trip.vehicle_id).first()
        driver = db.query(models.Driver).filter(models.Driver.id == trip.driver_id).first()

        if vehicle and vehicle.status == "On Trip":
            vehicle.status = "Available"
        if driver and driver.status == "On Trip":
            driver.status = "Available"

    trip.status = "Cancelled"
    db.commit()
    db.refresh(trip)
    return trip

def delete_trip(db: Session, trip_id: int):
    trip = get_trip(db, trip_id)
    if trip.status not in ["Draft", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft or Cancelled trips can be deleted"
        )
    db.delete(trip)
    db.commit()
    return {"detail": "Trip deleted successfully"}
