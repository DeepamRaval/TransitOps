from typing import Literal

VehicleStatus = Literal["Available", "On Trip", "In Shop", "Retired"]
DriverStatus = Literal["Available", "On Trip", "Off Duty", "Suspended"]
TripStatus = Literal["Draft", "Dispatched", "Completed", "Cancelled"]

VEHICLE_STATUSES: tuple[str, ...] = ("Available", "On Trip", "In Shop", "Retired")
DRIVER_STATUSES: tuple[str, ...] = ("Available", "On Trip", "Off Duty", "Suspended")
TRIP_STATUSES: tuple[str, ...] = ("Draft", "Dispatched", "Completed", "Cancelled")
VEHICLE_TYPES: tuple[str, ...] = ("Truck", "Van", "Sedan", "Container")
LICENSE_CATEGORIES: tuple[str, ...] = ("LMV", "HMV", "HGV", "MCWG")

