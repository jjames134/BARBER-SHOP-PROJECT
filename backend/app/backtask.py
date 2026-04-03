from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi_utils.tasks import repeat_every
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from jose import jwt
from app.model import (
    QueueSlots, BookedStatus, TypeUser, PreUser,
    NotificationType, Notification, User
)
import os

# ========================
# Config
# ========================
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
# ตั้งค่า Session Timeout (เช่น 180 นาที)
SESSION_TIMEOUT = timedelta(minutes=180)


# ========================
# Tasks (Background Jobs)
# ========================
def create_tasks(app: FastAPI):

    @app.on_event("startup")
    @repeat_every(seconds=60)
    async def auto_no_show():
        """
        ตรวจสอบคิวที่ลูกค้าไม่มาแสดงตัว (No Show) ภายใน 5 นาที
        """
        now = datetime.now(timezone.utc)
        db: Session = SessionLocal()
        try:
            # ค้นหาคิวที่สถานะเป็น BOOKED และเวลาเริ่มเลยมามากกว่า 5 นาทีแล้ว
            queues = db.query(QueueSlots).filter(
                QueueSlots.status == BookedStatus.BOOKED,
                QueueSlots.date_working == now.date(),
                QueueSlots.start_time <= (now - timedelta(minutes=5)).time(),
            ).all()

            for q in queues:
                if q.customer_id:
                    # สร้างการแจ้งเตือนส่งไปให้ลูกค้า
                    n = Notification(
                        user_id=q.customer_id,
                        type=NotificationType.QUEUE_CANCELLED,
                        title="คิวถูกยกเลิกอัตโนมัติ",
                        message="คิวของคุณถูกยกเลิกเนื่องจากไม่มาตามเวลาที่กำหนด",
                        ref_id=q.id,
                    )
                    db.add(n)

                # อัปเดตสถานะคิวให้เป็นว่างเพื่อให้คนอื่นจองต่อได้
                q.status = BookedStatus.NO_SHOW
                q.customer_id = None
                q.status_user = TypeUser.NONE

            if queues:
                db.commit()
        except Exception as e:
            print(f"Error in auto_no_show: {e}")
            db.rollback()
        finally:
            db.close()


def create_otp_cleanup_task(app: FastAPI):

    @app.on_event("startup")
    @repeat_every(seconds=300)
    async def cleanup_expired_otps():
        """
        ลบข้อมูลการลงทะเบียนชั่วคราว (PreUser) ที่ OTP หมดอายุแล้ว
        """
        now = datetime.now(timezone.utc)
        with SessionLocal() as db:
            try:
                expired = db.query(PreUser).filter(
                    PreUser.is_verified == False,
                    PreUser.otp_expire < now,
                ).all()
                for u in expired:
                    db.delete(u)
                if expired:
                    db.commit()
            except Exception as e:
                print(f"Error in cleanup_expired_otps: {e}")
                db.rollback()


# ========================
# Current User (Middleware Logic)
# ========================
def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    Dependency สำหรับดึงข้อมูล User จาก Token และตรวจสอบ Session Timeout
    """
    token = request.headers.get("Authorization")
    
    # 1. ตรวจสอบรูปแบบ Token
    if not token or not token.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid token format"
        )
    
    # 2. Decode JWT
    try:
        token_str = token.split(" ")[1]
        payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token missing user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    
    # 3. ดึงข้อมูล User จากฐานข้อมูล
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # 4. ตรวจสอบ Inactivity Timeout (SESSION_TIMEOUT)
    now = datetime.now(timezone.utc)

    if user.last_activity:
        # จัดการเรื่อง Timezone ให้เป็น UTC เหมือนกัน
        last_act = user.last_activity
        if last_act.tzinfo is None:
            last_act = last_act.replace(tzinfo=timezone.utc)
        
        # ตรวจสอบว่าไม่ได้ใช้งานนานเกินกว่าที่กำหนดหรือไม่
        if now - last_act > SESSION_TIMEOUT:
            # 🔴 หากต้องการให้ Refresh Token ทำงานได้ปกติ 
            # เราต้องยอมให้ /auth/profile ผ่านไปก่อนเพื่อให้หน้าบ้านอัปเดตเวลาได้
            # หรือปรับ SESSION_TIMEOUT ให้ยาวกว่าอายุ Access Token เสมอ
            raise HTTPException(
                status_code=401, 
                detail="Session expired due to inactivity. Please login again."
            )
    
    # 5. อัปเดตเวลาการใช้งานล่าสุด (Last Activity)
    user.last_activity = now
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
    
    return user