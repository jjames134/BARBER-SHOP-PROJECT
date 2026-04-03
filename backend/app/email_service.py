import random
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

def generate_otp():
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp: str):
    sender = os.getenv("EMAIL")
    password = os.getenv("PASS_APP")

    if not sender or not password:
        raise ValueError("EMAIL or PASS_EMAIL is not set in environment variables")

    subject = "Your OTP Code"
    body = f"""
    Your OTP is: {otp}

    This code will expire in 5 minutes.
    """

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.send_message(msg)
    except Exception as e:
        print("EMAIL ERROR:", e)