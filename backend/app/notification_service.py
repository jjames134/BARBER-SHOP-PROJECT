from sqlalchemy.orm import Session
from app.model import Notification, NotificationType
from abc import ABC, abstractmethod

# --- 1. Abstract Interface ---
# กำหนดโครงสร้างมาตรฐานที่ทั้ง Service จริง และ Proxy ต้องมี
class NotificationServiceInterface(ABC):
    @abstractmethod
    def push(self, db: Session, user_id: int, ntype: NotificationType, title: str, message: str, ref_id: int | None = None):
        pass

# --- 2. Real Service (The Object being proxied) ---
# ทำหน้าที่บันทึกข้อมูลลง Database จริงๆ เท่านั้น
class RealNotificationService(NotificationServiceInterface):
    def push(self, db: Session, user_id: int, ntype: NotificationType, title: str, message: str, ref_id: int | None = None):
        n = Notification(
            user_id=user_id,
            type=ntype,
            title=title,
            message=message,
            ref_id=ref_id,
        )
        db.add(n)
        # หมายเหตุ: caller ยังคงต้องเป็นคน commit ตามดีไซน์เดิมของคุณ

# --- 3. Proxy Class ---
# ทำหน้าที่ควบคุมการเข้าถึง เพิ่ม Logic ตรวจสอบ หรือ Logging
class NotificationProxy(NotificationServiceInterface):
    def __init__(self):
        self._real_service = RealNotificationService()

    def push(self, db: Session, user_id: int, ntype: NotificationType, title: str, message: str, ref_id: int | None = None):
        # Logic เสริม 1: Logging (ช่วยให้ Debug ง่ายขึ้นมาก)
        print(f"[NOTIFICATION PROXY] User ID: {user_id} | Type: {ntype.value} | Title: {title}")

        # Logic เสริม 2: การตรวจสอบความถูกต้องเบื้องต้น (Validation)
        if not user_id or user_id <= 0:
            print("[NOTIFICATION PROXY] Error: Invalid User ID, skipping...")
            return

        # Logic เสริม 3: ป้องกัน Message ว่างเปล่า
        if not message:
            message = "ไม่มีรายละเอียดข้อความ"

        # เมื่อตรวจสอบผ่านแล้ว จึงส่งต่อให้ Service จริงทำงาน
        self._real_service.push(db, user_id, ntype, title, message, ref_id)

# --- 4. Helper Functions (Global Instance) ---
# สร้าง instance ของ proxy ไว้ใช้งานที่เดียว
_proxy = NotificationProxy()

def notify_queue_booked(db: Session, user_id: int, queue_id: int, start_time: str, date_str: str):
    _proxy.push(
        db, user_id,
        NotificationType.QUEUE_BOOKED,
        title="จองคิวสำเร็จ",
        message=f"คิวของคุณเวลา {start_time} วันที่ {date_str} ได้รับการยืนยันแล้ว",
        ref_id=queue_id,
    )

def notify_queue_cancelled(db: Session, user_id: int, queue_id: int, reason: str = ""):
    _proxy.push(
        db, user_id,
        NotificationType.QUEUE_CANCELLED,
        title="คิวถูกยกเลิก",
        message=f"คิวของคุณถูกยกเลิก{(' — ' + reason) if reason else ''}",
        ref_id=queue_id,
    )

def notify_queue_no_show(db: Session, user_id: int, queue_id: int):
    _proxy.push(
        db, user_id,
        NotificationType.QUEUE_CANCELLED,
        title="คิวถูกยกเลิกอัตโนมัติ",
        message="คิวของคุณถูกยกเลิกเนื่องจากไม่มาตามเวลาที่กำหนด",
        ref_id=queue_id,
    )

def notify_leave_approved(db: Session, user_id: int, letter_id: int, date_leave: str):
    _proxy.push(
        db, user_id,
        NotificationType.LEAVE_APPROVED,
        title="คำขอลาได้รับการอนุมัติ",
        message=f"คำขอลาวันที่ {date_leave} ของคุณได้รับการอนุมัติแล้ว",
        ref_id=letter_id,
    )

def notify_leave_rejected(db: Session, user_id: int, letter_id: int, date_leave: str):
    _proxy.push(
        db, user_id,
        NotificationType.LEAVE_REJECTED,
        title="คำขอลาถูกปฏิเสธ",
        message=f"คำขอลาวันที่ {date_leave} ของคุณถูกปฏิเสธ",
        ref_id=letter_id,
    )

def notify_requeste(db: Session, user_id: int, letter_id: int, date_leave: str):
    _proxy.push(
        db, user_id,
        NotificationType.REQUESTE,
        title="คำขอลา",
        message=f"ขอลาวันที่ {date_leave} ",
        ref_id=letter_id,
    )