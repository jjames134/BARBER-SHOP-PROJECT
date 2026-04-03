from fastapi import FastAPI
from app.database import engine
from app import model
from app.model import Base,QueueSlots,BookedStatus
from app.auth import router as auth_router
from app.backtask import create_tasks,create_otp_cleanup_task
from fastapi.middleware.cors import CORSMiddleware
from app.queue_service import router as  queue_service_router
from app.barber_manage import router as barber_manage_router
from app.data_service import router as data_router
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal


app = FastAPI(
    title="Barber Shop API",
    version="2.0.0",
    description="Backend for Barber Shop booking system",
)
origin = "http://localhost:5173"
app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Tables found:", Base.metadata.tables.keys())
Base.metadata.create_all(engine)

app.include_router(auth_router)
app.include_router(queue_service_router)
app.include_router(barber_manage_router)
app.include_router(data_router)
create_tasks(app)
create_otp_cleanup_task(app)

# เปิด Path ให้เข้าถึงรูปภาพได้ เช่น http://localhost:8000/static/profile_images/user_1.jpg
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "version": "1.0.0"}
 
 
@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

def check_no_show():
    db = SessionLocal()
    try:
        now = datetime.now()
        current_time = now.time()
        today = now.date()

        # ค้นหาคิวที่:
        # 1. เป็นของวันนี้
        # 2. สถานะยังเป็น BOOKED (จองแล้วแต่ไม่มาเช็คอิน)
        # 3. เวลาเริ่ม (start_time) เลยเวลาปัจจุบันไปแล้ว (เช่น เลยมา 15 นาที)
        # *คุณสามารถตั้งค่า Grace Period ได้ เช่น q.start_time < (datetime.now() - timedelta(minutes=15)).time()
        
        expired_queues = db.query(QueueSlots).filter(
            QueueSlots.date_working == today,
            QueueSlots.status == BookedStatus.BOOKED,
            QueueSlots.start_time < current_time 
        ).all()

        for q in expired_queues:
            q.status = BookedStatus.NO_SHOW
            # อาจจะส่งแจ้งเตือนบอกลูกค้าที่นี่
            print(f"Queue {q.id} marked as NO_SHOW")
        
        db.commit()
    except Exception as e:
        print(f"Error updating no-show: {e}")
    finally:
        db.close()