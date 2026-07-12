import asyncio
import calendar
from datetime import date

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..email_service import send_license_expiry_reminder
from ..models import Driver, LicenseReminderLog

REMINDER_MILESTONES = (
    ("1_week", "1 week", {"days": 7}),
    ("1_month", "1 month", {"months": 1}),
    ("3_months", "3 months", {"months": 3}),
    ("6_months", "6 months", {"months": 6}),
)


def _subtract_months(value: date, months: int) -> date:
    month_index = value.month - 1 - months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _reminder_date(expiry_date: date, offset: dict[str, int]) -> date:
    if "months" in offset:
        return _subtract_months(expiry_date, offset["months"])
    return date.fromordinal(expiry_date.toordinal() - offset["days"])


def trigger_driver_license_reminders(db: Session, driver: Driver, today: date | None = None) -> bool:
    if not driver.email or driver.email.endswith("@placeholder.transitops.dev"):
        return False

    today = today or date.today()
    if driver.license_expiry_date < today:
        return False  # Already expired

    for reminder_key, reminder_label, offset in REMINDER_MILESTONES:
        reminder_date = _reminder_date(driver.license_expiry_date, offset)

        # Is this milestone due? (today is on or after the reminder date)
        if today >= reminder_date:
            already_sent = (
                db.query(LicenseReminderLog)
                .filter(
                    LicenseReminderLog.driver_id == driver.id,
                    LicenseReminderLog.license_expiry_date == driver.license_expiry_date,
                    LicenseReminderLog.reminder_key == reminder_key,
                )
                .first()
            )
            if already_sent:
                # If this one has been sent, since they are ordered by urgency (most urgent first),
                # we don't need to check less urgent ones.
                break

            # Send the reminder
            try:
                send_license_expiry_reminder(
                    to_email=driver.email,
                    driver_name=driver.name,
                    license_number=driver.license_number,
                    expiry_date=driver.license_expiry_date.isoformat(),
                    reminder_label=reminder_label,
                )
                db.add(
                    LicenseReminderLog(
                        driver_id=driver.id,
                        license_expiry_date=driver.license_expiry_date,
                        reminder_key=reminder_key,
                    )
                )
                db.commit()
                return True
            except Exception as exc:
                db.rollback()
                print(f"Failed to send license reminder to {driver.email}: {exc}")
                return False

    return False


def send_due_license_reminders(db: Session, today: date | None = None) -> int:
    today = today or date.today()
    sent_count = 0

    drivers = (
        db.query(Driver)
        .filter(Driver.email.isnot(None), Driver.license_expiry_date >= today)
        .all()
    )

    for driver in drivers:
        if trigger_driver_license_reminders(db, driver, today):
            sent_count += 1

    return sent_count


async def run_license_reminder_scheduler() -> None:
    while True:
        db = SessionLocal()
        try:
            sent = send_due_license_reminders(db)
            if sent:
                print(f"Sent {sent} driver license expiry reminder(s).")
        except Exception as exc:
            db.rollback()
            print(f"Failed to send driver license expiry reminders: {exc}")
        finally:
            db.close()

        await asyncio.sleep(24 * 60 * 60)
