from fastapi import APIRouter, Depends, HTTPException, Request, File, UploadFile, Form
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.model import (
    User, Barber, QueueSlots, LeaveLetter,
    BookedStatus, UserRole, LeaveStatus, TypeUser,
    PageView, Notification, CustomeIMgWebsite, Description, CategoryImg,
    Chair,OpeningDate
)
from sqlalchemy.orm import joinedload
from app.rolebase import require_roles
from app.backtask import get_current_user
from app.schemas import (
    PageViewCreate, CustomeIMgWebsiteUpdate, CustomeIMgWebsiteResponse,
    DescriptionUpdate, DescriptionResponse, NotificationResponse,NotificationListResponse
)
from datetime import date, timedelta, datetime
from typing import Literal
import calendar
import shutil
import os
import uuid

router = APIRouter(prefix="/data_service", tags=["Data_Service"])

# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def _week_range(d: date) -> tuple[date, date]:
    start = d - timedelta(days=d.weekday())
    return start, start + timedelta(days=6)

def _month_range(d: date) -> tuple[date, date]:
    last = calendar.monthrange(d.year, d.month)[1]
    return d.replace(day=1), d.replace(day=last)

def _date_range(period: str, ref: date) -> tuple[date, date]:
    if period == "day":
        return ref, ref
    elif period == "week":
        return _week_range(ref)
    else:
        return _month_range(ref)

# ═══════════════════════════════════════════
# PAGE VIEW
# ═══════════════════════════════════════════

@router.post("/page_view", status_code=201)
def record_page_view(
    data: PageViewCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OWNER]))
):
    user_id = None
    # ดึง user_id จาก token ถ้ามีการส่งมา
    auth = request.headers.get("Authorization")
    if auth:
        try:
            # ใช้การตรวจสอบ token เบื้องต้นเพื่อดึง id (ถ้าจำเป็น)
            pass 
        except:
            pass

    view = PageView(
        user_id=user_id,
        session_id=data.session_id,
        path=data.path,
    )
    db.add(view)
    try:
        db.commit()
    except:
        db.rollback() 
    return {"ok": True}

# ... (page_view/summary และ daily_series ใช้ logic เดิมได้เลยตาม Model PageView)

# ═══════════════════════════════════════════
# DATA FOR DASHBOARD
# ═══════════════════════════════════════════

@router.get("/num_queues")
def num_queues(db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OWNER]))):
    # นับทั้งหมด
    total_queues = db.query(func.count(QueueSlots.id)).scalar()
    
    # นับแยกตามสถานะ (ตัวอย่างสถานะหลักๆ)
    booked = db.query(func.count(QueueSlots.id)).filter(QueueSlots.status == BookedStatus.BOOKED).scalar()
    available = db.query(func.count(QueueSlots.id)).filter(QueueSlots.status == BookedStatus.AVAILABLE).scalar()
    checkin = db.query(func.count(QueueSlots.id)).filter(QueueSlots.status == BookedStatus.CHECKIN).scalar()
    complete = db.query(func.count(QueueSlots.id)).filter(QueueSlots.status == BookedStatus.COMPLETE).scalar()

    return {
        "total": total_queues,
        "booked": booked,
        "available": available,
        "checkin": checkin,
        "complete": complete
    }

@router.get("/num_customer")
def num_customer(db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OWNER]))):
    # จำนวนลูกค้าทั้งหมด (ที่มี role เป็น CUSTOMER)
    total_customers = db.query(func.count(User.id)).filter(User.rolestatus == UserRole.CUSTOMER).scalar()
    
    # จำนวนลูกค้าที่มีคิวค้างอยู่ (BOOKED หรือ CHECKIN)
    active_customers = db.query(func.count(func.distinct(QueueSlots.customer_id)))\
        .filter(QueueSlots.status.in_([BookedStatus.BOOKED, BookedStatus.CHECKIN]))\
        .scalar()

    return {
        "total_customers": total_customers,
        "active_customers": active_customers  # ลูกค้าที่กำลังใช้บริการหรือรอคิว
    }

@router.get("/num_barber")
def num_barber(db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OWNER]))):
    # จำนวนช่างทั้งหมด
    total_barbers = db.query(func.count(Barber.id)).scalar()
    
    # จำนวนช่างที่ลาในวันนี้ (APPROVED สำหรับวันนี้)
    today = date.today()
    on_leave = db.query(func.count(func.distinct(LeaveLetter.barber_id)))\
        .filter(LeaveLetter.date_leave == today, LeaveLetter.status == LeaveStatus.APPROVED)\
        .scalar()
    
    # จำนวนช่างที่กำลังให้บริการ (มีการ assign ลงใน Chair และไม่ลา)
    # หมายเหตุ: ใน model คุณใช้ chair.barber_id ในการระบุการทำงาน
    active_barbers = db.query(func.count(func.distinct(Chair.barber_id)))\
        .filter(Chair.barber_id != None).scalar()

    return {
        "total_barbers": total_barbers,
        "on_leave_today": on_leave,
        "working_now": active_barbers
    }

@router.get("/num_letter")
def num_letter(db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.OWNER]))):
    today = date.today()
    
    # ดึงข้อมูลพื้นฐานของวันนี้
    base_query = db.query(LeaveLetter).filter(LeaveLetter.date_leave == today)
    
    total_today = base_query.count()
    approved = base_query.filter(LeaveLetter.status == LeaveStatus.APPROVED).count()
    rejected = base_query.filter(LeaveLetter.status == LeaveStatus.REJECTED).count()
    pending = base_query.filter(LeaveLetter.status == LeaveStatus.PENDING).count()

    return {
        "today_total": total_today,
        "approved": approved,
        "rejected": rejected,
        "pending": pending
    }

# ═══════════════════════════════════════════
# CUSTOMIZE WEBSITE (จัดการรูปภาพและข้อความ)
# ═══════════════════════════════════════════

# กำหนด Path พื้นฐาน (อิงตามรูปโครงสร้าง folder)
BASE_STATIC_DIR = "static/web_img"
# ตรวจสอบว่า Folder หลักมีอยู่จริง ถ้าไม่มีให้สร้าง
os.makedirs(BASE_STATIC_DIR, exist_ok=True)

# ดึงรูปแยกตาม Category เพื่อให้ Frontend ไป Render ลงช่องที่ถูกต้องได้ง่าย
@router.get("/website/images", response_model=dict[str, list[CustomeIMgWebsiteResponse]])
def get_website_images(db: Session = Depends(get_db)): # ลบ user: User ออก
    images = db.query(CustomeIMgWebsite).all()
    # ... logic เดิม ...
    
    result = {
        "BANNER": [img for img in images if img.cate == CategoryImg.BANNER],
        "MAIN_IMG": [img for img in images if img.cate == CategoryImg.MAIN_IMG]
    }
    return result


# แก้ไข: เพิ่มรูปภาพแบบ Upload ไฟล์จริง
@router.post("/website/images", response_model=CustomeIMgWebsiteResponse)
async def add_website_image(
    cate: CategoryImg = Form(...),          # รับค่า Enum จาก Form data
    file: UploadFile = File(...),           # รับไฟล์รูปภาพ
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db)
):
    # 1. ตรวจสอบนามสกุลไฟล์เบื้องต้น
    allowed_extensions = ["jpg", "jpeg", "png", "webp"]
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"รองรับเฉพาะไฟล์ {', '.join(allowed_extensions)}")

    # 2. กำหนด Folder ปลายทางตาม Category
    if cate == CategoryImg.BANNER:
        # ใช้ 'banber_img' ตามรูปที่คุณให้มา (แม้จะสะกดผิด)
        target_subfolder = "banber_img" 
    elif cate == CategoryImg.MAIN_IMG:
        target_subfolder = "main_img"
    else:
        raise HTTPException(status_code=400, detail="Invalid image category")

    target_dir = os.path.join(BASE_STATIC_DIR, target_subfolder)
    # สร้าง folder ย่อยถ้ายังไม่มี
    os.makedirs(target_dir, exist_ok=True)

    # 3. ตั้งชื่อไฟล์ใหม่เพื่อป้องกันชื่อซ้ำ (ใช้ UUID)
    new_filename = f"{uuid.uuid4()}.{file_ext}"
    final_save_path = os.path.join(target_dir, new_filename)

    # 4. บันทึกไฟล์ลง Disk
    try:
        with open(final_save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ไม่สามารถบันทึกไฟล์ได้: {str(e)}")
    finally:
        await file.close() # ปิด file stream

    # 5. บันทึก Path ลงฐานข้อมูล
    # ปรับ format path ให้เป็นมาตรฐาน url (ใช้ / เสมอ) เช่น "static/web_img/main_img/abc.jpg"
    db_path = final_save_path.replace("\\", "/") 
    
    new_img = CustomeIMgWebsite(path_img=db_path, cate=cate)
    db.add(new_img)
    db.commit()
    db.refresh(new_img)
    
    return new_img


# แก้ไข: ลบรูปภาพ (เพิ่มการลบไฟล์จริงออกจาก Disk)
@router.delete("/website/images/{img_id}")
def delete_website_image(
    img_id: int,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db)
):
    img = db.query(CustomeIMgWebsite).filter(CustomeIMgWebsite.id == img_id).first()
    if not img:
        raise HTTPException(404, "Image not found")
    
    # ลบไฟล์จริงออกจาก Disk เพื่อไม่ให้ขยะเต็ม Server
    if os.path.exists(img.path_img):
        try:
            os.remove(img.path_img)
        except Exception as e:
            # แค่ log error ไว้ แต่ไม่ขัดขวางการลบใน DB (หรือจะจัดการตามความเหมาะสม)
            print(f"Error removing file {img.path_img}: {e}")
    
    db.delete(img)
    db.commit()
    return {"message": "Deleted successfully"}


@router.get("/website/description", response_model=DescriptionResponse)
def get_description(db: Session = Depends(get_db)): # ลบ user: User ออก
    # ... logic เดิม ...
    # ดึงอันแรกที่เจอ (เพราะมีแค่อันเดียว) ถ้าไม่มีให้สร้างอันว่างๆ ไว้
    desc = db.query(Description).first()
    if not desc:
        # กรณีรันครั้งแรกแล้วยังไม่มีข้อมูลใน DB
        new_desc = Description(massege="")
        db.add(new_desc)
        db.commit()
        db.refresh(new_desc)
        return new_desc
    return desc

@router.patch("/website/description", response_model=DescriptionResponse)
def update_description(
    data: DescriptionUpdate,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db)
):
    # อัปเดตอันที่มีอยู่แล้ว (ไม่ต้องรับ id จาก path เพราะมีอันเดียว)
    desc = db.query(Description).first()
    if not desc:
        raise HTTPException(404, "Description record not found")
    
    if data.massege is not None:
        desc.massege = data.massege
        
    db.commit()
    db.refresh(desc)
    return desc

# ═══════════════════════════════════════════
# PROFILE & FILE UPLOADS
# ═══════════════════════════════════════════

# แก้ตัวสะกดให้ตรงตามรูป (default)
DEFAULT_AVATAR = "static/profile_images/default_profile/profile-icon.png"
# โฟลเดอร์สำหรับเก็บรูปที่ user อัปโหลดใหม่
UPLOAD_DIR = "static/profile_images/user_profile"

@router.patch("/upload_profile_img")
async def upload_profile_image(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. ตรวจสอบนามสกุลไฟล์
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(400, "Support only .jpg, .png")

    # 2. ตั้งชื่อและ Path ใหม่ (บันทึกลงใน user_profile)
    file_name = f"user_{current_user.id}_{int(datetime.now().timestamp())}.{file_ext}"
    new_file_path = os.path.join(UPLOAD_DIR, file_name)

    # 3. ลบรูปเก่า (ยกเว้นรูปใน deafault_profile)
    if current_user.profile_img:
        if current_user.profile_img != DEFAULT_AVATAR and os.path.exists(current_user.profile_img):
            try:
                os.remove(current_user.profile_img)
            except:
                pass

    # 4. บันทึกไฟล์ใหม่
    with open(new_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. อัปเดต DB
    current_user.profile_img = new_file_path
    db.commit()

    return {"message": "Success", "path": new_file_path}

# ═══════════════════════════════════════════
# NOTIFICATION
# ═══════════════════════════════════════════

@router.get("/notifications", response_model=list[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.create_at.desc()).limit(50).all()

# ... (mark_read และ mark_all_read ใช้ logic เดิมได้เลย)

@router.get("/chairs")
def get_chairs(db: Session = Depends(get_db)):
    # ดึงเก้าอี้ทั้งหมด พร้อมข้อมูลช่างที่นั่งอยู่ (ถ้ามี)
    chairs = db.query(Chair).options(joinedload(Chair.barber).joinedload(Barber.user_data)).all()
    return chairs

@router.get("/notifications", response_model=NotificationListResponse) 
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ดึงข้อมูลและเรียงลำดับจากใหม่ไปเก่า (desc)
    notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .order_by(Notification.create_at.desc())\
        .all()
    
    unread_count = db.query(Notification)\
        .filter(
            Notification.user_id == current_user.id, 
            Notification.is_read == False
        ).count()
    
    return {
        "items": notifications,
        "unread_count": unread_count
    }

@router.get("/data_date")
def data_date(db: Session = Depends(get_db)):
    # ดึงข้อมูลการตั้งค่าเฉพาะของ "วันนี้"
    today = date.today()
    
    shop_config = db.query(OpeningDate).filter(OpeningDate.date_open == today).first()

    # ถ้าวันนี้ยังไม่มีการตั้งค่าใน DB เลย (เช่น เพิ่งขึ้นวันใหม่)
    # เราควรส่งค่า Default กลับไปเพื่อให้ Frontend ทำงานต่อได้ไม่พัง
    if not shop_config:
        return {
            "date_open": today.isoformat(),
            "is_open": False,
            "open_time": "10:00:00",
            "close_time": "15:00:00",
            "message": "no_config_found_using_default"
        }

    # ถ้ามีข้อมูล ให้ส่งข้อมูลจริงกลับไป
    return {
        "id": shop_config.id,
        "date_open": shop_config.date_open.isoformat(),
        "is_open": shop_config.is_open,
        "open_time": shop_config.open_time.strftime("%H:%M:%S"),
        "close_time": shop_config.close_time.strftime("%H:%M:%S")
    }