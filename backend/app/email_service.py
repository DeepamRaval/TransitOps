import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import settings


def send_otp_email(to_email: str, otp: str, purpose: str) -> None:
    if not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP_PASSWORD is not configured")

    subject_map = {
        "register": "TransitOps — Verify your email",
        "reset_password": "TransitOps — Reset your password",
    }
    subject = subject_map.get(purpose, "TransitOps — Verification code")

    body = f"""Hello,

Your TransitOps verification code is: {otp}

This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.
If you did not request this, you can safely ignore this email.

— TransitOps Smart Transport Operations
"""

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
