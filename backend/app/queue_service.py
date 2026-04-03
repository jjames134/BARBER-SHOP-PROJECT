from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, time
from typing import List
from app.database import get_db
from app.model import (
    Chair, Barber, QueueSlots, User, OpeningDate,
    BookedStatus, TypeUser, UserRole
)
from app.rolebase import require_roles, require_barber
from app.backtask import get_current_user

router = APIRouter(prefix="/queue_service", tags=["Queue_Service"])

# ==========================================
# 1. STATE MANAGEMENT LOGIC
# ==========================================
class QueueStateManager:
    """จัดการ Logic การเปลี่ยนสถานะของคิวให้เป็นไปตามกฎของร้าน"""
    ALLOWED_TRANSITIONS = {
        BookedStatus.AVAILABLE: [BookedStatus.BOOKED, BookedStatus.CHECKIN, BookedStatus.NO_SHOW],
        BookedStatus.BOOKED:    [BookedStatus.CHECKIN, BookedStatus.CANCELLED, BookedStatus.AVAILABLE],
        BookedStatus.CHECKIN:   [BookedStatus.COMPLETE],
        BookedStatus.CANCELLED: [BookedStatus.AVAILABLE, BookedStatus.BOOKED],
        BookedStatus.NO_SHOW:   [BookedStatus.AVAILABLE]
    }

    @staticmethod
    def transition_to(queue: QueueSlots, new_status: BookedStatus):
        # ตรวจสอบว่าสามารถเปลี่ยนจากสถานะปัจจุบันไปสถานะใหม่ได้หรือไม่
        if new_status not in QueueStateManager.ALLOWED_TRANSITIONS.get(queue.status, []):
            return False
        queue.status = new_status
        return True

# ==========================================
# 2. BARBER WORK TABLE (ดึงตาม Profile ช่าง)
# ==========================================


@router.get("/my-work-table")
def get_my_work_table(db: Session = Depends(get_db), current_user: User = Depends(require_barber())):
    today = date.today()
    
    # --- STEP 1: เช็คว่าวันนี้ร้านเปิดไหม ---
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == today).first()
    if not opening or not opening.is_open:
        return {"is_shop_open": False, "message": "วันนี้เป็นวันหยุดของทางร้าน"}

    # --- STEP 2: หาเก้าอี้ของช่าง ---
    chair = db.query(Chair).join(Barber).filter(Barber.user_id == current_user.id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="คุณยังไม่ได้รับมอบหมายให้ดูแลเก้าอี้ตัวใด")

    # --- STEP 3: ดึงข้อมูลคิวและคำนวณสถานะอัตโนมัติ ---
    queues = db.query(QueueSlots).options(joinedload(QueueSlots.customer)).filter(
        QueueSlots.chair_id == chair.id,
        QueueSlots.date_working == today
    ).order_by(QueueSlots.start_time).all()

    now = datetime.now()
    output = []
    for q in queues:
        q_start_dt = datetime.combine(q.date_working, q.start_time)
        q_end_dt = datetime.combine(q.date_working, q.end_time)
        diff_minutes = (now - q_start_dt).total_seconds() / 60

        # Auto-update logic (15 mins limit)
        if q.status == BookedStatus.BOOKED and diff_minutes > 15:
            q.status = BookedStatus.AVAILABLE
            q.customer_id = None
            q.status_user = TypeUser.NONE
        elif q.status == BookedStatus.AVAILABLE and diff_minutes > 30:
            q.status = BookedStatus.NO_SHOW
        elif q.status == BookedStatus.CHECKIN and now > q_end_dt:
            q.status = BookedStatus.COMPLETE

        output.append({
            "id": q.id,
            "chair_id": chair.id,
            "start_time": q.start_time.strftime("%H:%M"),
            "end_time": q.end_time.strftime("%H:%M"),
            "status": q.status.value,
            "customer_name": "ลูกค้า Walk-in" if q.status_user == TypeUser.WALK_IN else 
                             (f"{q.customer.firstname}" if q.customer else "ว่าง")
        })
    
    db.commit()
    return {
        "is_shop_open": True,
        "chair_name": chair.name,
        "queues": output
    }

# API สำหรับกดยกเลิก (คืนสถานะเป็น AVAILABLE)
@router.post("/chairs/{chair_id}/queues/{queue_id}/cancel-action")
def cancel_queue_action(queue_id: int, db: Session = Depends(get_db), barber: User = Depends(require_barber())):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if not queue:
        raise HTTPException(404, "ไม่พบข้อมูลคิว")
    
    # ล้างข้อมูลการจองกลับไปเป็นว่าง
    queue.status = BookedStatus.AVAILABLE
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    db.commit()
    return {"detail": "ยกเลิกรายการและคืนสล็อตว่างแล้ว"}

# ==========================================
# 3. ACTIONS (Walk-in, Check-in, Complete)
# ==========================================

@router.post("/chairs/{chair_id}/queues/{queue_id}/walkin")
def action_walkin(queue_id: int, db: Session = Depends(get_db), barber: User = Depends(require_barber())):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    
    if not queue or queue.status not in [BookedStatus.AVAILABLE, BookedStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="คิวนี้ไม่สามารถทำ Walk-in ได้")
    
    # เปลี่ยนสถานะเป็น CHECKIN ทันทีสำหรับ Walk-in
    queue.status = BookedStatus.CHECKIN
    queue.status_user = TypeUser.WALK_IN
    queue.customer_id = None 
    
    db.commit()
    return {"detail": "เริ่มบริการ Walk-in เรียบร้อย"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/checkin")
def action_checkin(queue_id: int, db: Session = Depends(get_db), barber: User = Depends(require_barber())):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    
    if not queue or queue.status != BookedStatus.BOOKED:
        raise HTTPException(status_code=400, detail="ไม่พบรายการจองที่รอเช็คอิน")
    
    queue.status = BookedStatus.CHECKIN
    db.commit()
    return {"detail": "เช็คอินลูกค้าเรียบร้อย"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/complete")
def action_complete(queue_id: int, db: Session = Depends(get_db), barber: User = Depends(require_barber())):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    
    if not queue or queue.status != BookedStatus.CHECKIN:
        raise HTTPException(status_code=400, detail="คิวไม่อยู่ในสถานะที่กำลังให้บริการ")
    
    queue.status = BookedStatus.COMPLETE
    db.commit()
    return {"detail": "บริการเสร็จสิ้น"}

# ==========================================
# 4. CUSTOMER ENDPOINTS (จองคิว/ดูคิวตัวเอง)
# ==========================================

@router.get("/my-bookings")
def get_my_bookings(user: User = Depends(require_roles([UserRole.CUSTOMER])), db: Session = Depends(get_db)):
    bookings = db.query(QueueSlots).options(
        joinedload(QueueSlots.chair).joinedload(Chair.barber).joinedload(Barber.user_data)
    ).filter(
        QueueSlots.customer_id == user.id,
        QueueSlots.date_working >= date.today()
    ).order_by(QueueSlots.date_working, QueueSlots.start_time).all()

    return [{
        "id": b.id,
        "chair_name": b.chair.name,
        "barber_name": b.chair.barber.user_data.firstname if b.chair.barber else "ช่างประจำร้าน",
        "date_working": b.date_working.isoformat(),
        "start_time": b.start_time.strftime("%H:%M:%S"),
        "end_time": b.end_time.strftime("%H:%M:%S"),
        "status": b.status.value
    } for b in bookings]


@router.get("/chairs")
def get_chairs_for_customer(db: Session = Depends(get_db)):
    """
    ดึงรายการเก้าอี้สำหรับลูกค้า โดยใช้เวลาปัจจุบันของ Server 
    ตรวจสอบวันเปิด/ปิดร้าน และนับจำนวนคิวว่างที่ยังไม่เลยเวลา
    """
    # 1. ดึงเวลาและวันที่ปัจจุบันจาก Server
    now = datetime.now()
    today_date = now.date()
    
    # 2. ตรวจสอบสถานะร้านจาก Table OpeningDate (อิงตามวันที่ของ Server)
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == today_date).first()
    
    # ถ้าไม่มีข้อมูลใน DB สำหรับวันนี้ หรือตั้งค่า is_open เป็น False
    if not opening or not opening.is_open:
        return {
            "shop_status": "closed", 
            "message": "ขออภัย วันนี้ร้านหยุดให้บริการ",
            "chairs": []
        }

    # 3. ดึงเก้าอี้ทั้งหมด พร้อมโหลดข้อมูลช่าง (Barber) มาด้วย (Eager Loading)
    chairs = db.query(Chair).options(
        joinedload(Chair.barber).joinedload(Barber.user_data)
    ).all()
    
    output = []

    for c in chairs:
        # ดึงคิวทั้งหมดของเก้าอี้ตัวนี้ในวันนี้
        queues = db.query(QueueSlots).filter(
            QueueSlots.chair_id == c.id,
            QueueSlots.date_working == today_date
        ).all()

        # --- LOGIC การนับคิวว่าง (Real-time) ---
        # นับเฉพาะคิวที่มีสถานะ AVAILABLE และ "เวลาเริ่มคิว" ต้องยังไม่เลยเวลาปัจจุบัน
        available_count = 0
        for q in queues:
            # รวมวันที่และเวลาเริ่มคิวเข้าด้วยกันเพื่อเปรียบเทียบ
            q_start_dt = datetime.combine(q.date_working, q.start_time)
            
            if q.status == BookedStatus.AVAILABLE and q_start_dt > now:
                available_count += 1

        # --- กำหนดสถานะเก้าอี้สำหรับการแสดงผลบน Frontend ---
        # ready     = มีช่าง และ มีคิวว่างเหลืออยู่
        # full      = มีช่าง แต่ คิวเต็มหมดแล้ว หรือเลยเวลาไปหมดแล้ว
        # not_ready = เก้าอี้ตัวนี้ไม่มีช่างประจำการ
        
        status = "not_ready"
        status_text = "ไม่มีช่างประจำ"
        allow_booking = False

        if c.barber:
            if available_count > 0:
                status = "ready"
                status_text = "พร้อมให้บริการ"
                allow_booking = True
            else:
                status = "full"
                status_text = "คิวเต็ม/ปิดรับคิว"
                allow_booking = False

        output.append({
            "id": c.id,
            "name": c.name,
            "barber_name": c.barber.user_data.firstname if c.barber else None,
            "status": status,
            "statusText": status_text,
            "allowBooking": allow_booking,
            "available_count": available_count
        })

    return {
        "shop_status": "open",
        "current_server_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "chairs": output
    }

@router.get("/queues")
def get_queues_for_customer(chair_id: int, db: Session = Depends(get_db)):
    """
    ดึงรายการคิวของเก้าอี้ตัวที่ระบุ โดยใช้เวลาปัจจุบันของ Server
    เพื่อนำมาแสดงผลในหน้าจองคิวของลูกค้า
    """
    # 1. ดึงเวลาปัจจุบันของ Server
    now = datetime.now()
    today_date = now.date()

    # 2. ตรวจสอบว่าเก้าอี้มีตัวตนอยู่จริงไหม
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลเก้าอี้")

    # 3. ดึงคิวทั้งหมดของเก้าอี้นี้ในวันนี้ เรียงตามเวลาเริ่ม
    queues = db.query(QueueSlots).filter(
        QueueSlots.chair_id == chair_id,
        QueueSlots.date_working == today_date
    ).order_by(QueueSlots.start_time).all()

    output = []
    for q in queues:
        # รวมวันที่และเวลาเพื่อใช้เปรียบเทียบ
        q_start_dt = datetime.combine(q.date_working, q.start_time)
        
        # คำนวณความต่างของเวลา (นาที)
        # ถ้า diff > 0 แสดงว่า "เลยเวลาเริ่มคิวมาแล้ว"
        time_diff = (now - q_start_dt).total_seconds() / 60

        # --- LOGIC การตัดสินสถานะ (เพื่อให้ Frontend แสดงผลตามเงื่อนไข) ---
        current_status = q.status.value # ค่าเริ่มต้นจาก DB (AVAILABLE, BOOKED, etc.)

        # เงื่อนไข NO_SHOW: 
        # ถ้าสถานะยังเป็น AVAILABLE หรือ BOOKED แต่เลยเวลาเริ่มมาแล้วเกิน 30 นาที
        if (q.status == BookedStatus.AVAILABLE or q.status == BookedStatus.BOOKED) and time_diff > 30:
            current_status = "NO_SHOW"

        # ข้อมูลที่จะส่งกลับไปให้ Frontend
        output.append({
            "id": q.id,
            "start_time": q.start_time.strftime("%H:%M"),
            "end_time": q.end_time.strftime("%H:%M"),
            "status": current_status,
            "customer_id": q.customer_id, # ส่ง id ลูกค้าไปเพื่อให้ Frontend เช็คว่าเป็น "คิวของเรา" หรือไม่
        })

    return output

@router.post("/user/{chair_id}/queues/{queue_id}/booked")
def book_queue(chair_id: int, queue_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    API สำหรับการจองคิว (ต้องผ่านการ Login)
    """
    # 1. ตรวจสอบสิทธิ์ (เฉพาะ CUSTOMER)
    if current_user.rolestatus != "CUSTOMER":
        raise HTTPException(status_code=403, detail="เฉพาะบัญชีลูกค้าเท่านั้นที่จองได้")

    # 2. ค้นหาคิวที่ต้องการจอง
    queue = db.query(QueueSlots).filter(
        QueueSlots.id == queue_id,
        QueueSlots.chair_id == chair_id
    ).first()

    if not queue:
        raise HTTPException(status_code=404, detail="ไม่พบช่วงเวลาที่ต้องการจอง")

    # 3. ตรวจสอบว่าคิวว่างอยู่จริงไหม และยังไม่เลยเวลา No-show
    now = datetime.now()
    q_start_dt = datetime.combine(queue.date_working, queue.start_time)
    time_diff = (now - q_start_dt).total_seconds() / 60

    if queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="คิวนี้ถูกจองไปแล้ว")
    
    if time_diff > 30:
        raise HTTPException(status_code=400, detail="ไม่สามารถจองได้ เนื่องจากเลยเวลาเริ่มคิวมานานเกินไป")

    # 4. ทำการจอง
    queue.status = BookedStatus.BOOKED
    queue.customer_id = current_user.id
    # (Optional) เก็บเวลาที่ทำการจองจริง
    # queue.booked_at = now 

    db.commit()
    db.refresh(queue)

    return {
        "id": queue.id,
        "message": "จองคิวสำเร็จ",
        "start_time": queue.start_time
    }

def is_customer(current_user = Depends(get_current_user)):
    """
    ตรวจสอบว่า User ที่ Login อยู่มี Role เป็น CUSTOMER หรือไม่
    """
    if current_user.rolestatus != "CUSTOMER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="สิทธิ์การเข้าถึงถูกปฏิเสธ: เฉพาะลูกค้าเท่านั้นที่สามารถทำรายการนี้ได้"
        )
    return current_user

@router.post("/user/{chair_id}/queues/{queue_id}/booked")
def book_queue(
    chair_id: int, 
    queue_id: int, 
    db: Session = Depends(get_db), 
    # ใช้ Dependency ที่เราสร้างไว้ข้างบน
    current_customer = Depends(is_customer) 
):
    # ถ้า Code ไหลมาถึงตรงนี้ได้ แปลว่าเป็น CUSTOMER แน่นอน
    
    # 1. ค้นหาคิวที่ต้องการจอง
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()

    # 2. ตรวจสอบว่าคิวว่างจริงไหม (กันคนแอบจองซ้ำ)
    if not queue or queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="ขออภัย คิวนี้ถูกจองไปแล้ว")

    # 3. บันทึกการจองโดยใช้ ID ของคนที่ Login อยู่
    queue.status = BookedStatus.BOOKED
    queue.customer_id = current_customer.id  # ใช้ ID จาก Token โดยตรง (ปลอดภัยที่สุด)
    
    db.commit()
    db.refresh(queue)

    return {
        "message": "จองสำเร็จ",
        "queue_id": queue.id,
        "customer_name": current_customer.username
    }


# ==========================================
# 5. SHOP MANAGEMENT (เปิด/ปิดร้าน + บันทึกเวลา)
# ==========================================

@router.post("/set_opening")
def set_opening(
    open_time: str,
    close_time: str,
    is_open: str,  # รับเป็น str เพื่อแปลงจาก URLSearchParams ที่ส่ง "true"/"false"
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER]))
):
    """
    บันทึก/อัพเดต เวลาเปิด-ปิดของร้านสำหรับวันนี้
    """
    today = date.today()
    
    # แปลง is_open string เป็น boolean
    is_open_bool = is_open.lower() in ["true", "1", "yes"]
    
    # แปลง string เป็น time object (รับทั้ง HH:MM และ HH:MM:SS)
    try:
        if len(open_time.split(':')) == 2:
            open_time_obj = datetime.strptime(open_time, "%H:%M").time()
        else:
            open_time_obj = datetime.strptime(open_time, "%H:%M:%S").time()
        
        if len(close_time.split(':')) == 2:
            close_time_obj = datetime.strptime(close_time, "%H:%M").time()
        else:
            close_time_obj = datetime.strptime(close_time, "%H:%M:%S").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="รูปแบบเวลาไม่ถูกต้อง (ใช้ HH:MM หรือ HH:MM:SS)")
    
    # ตรวจสอบให้ close_time > open_time
    if close_time_obj <= open_time_obj:
        raise HTTPException(status_code=400, detail="เวลาปิดต้องหลังเวลาเปิด")
    
    # ค้นหาหรือสร้าง OpeningDate record สำหรับวันนี้
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == today).first()
    
    if opening:
        # อัพเดต
        opening.open_time = open_time_obj
        opening.close_time = close_time_obj
        opening.is_open = is_open_bool
    else:
        # สร้างใหม่
        opening = OpeningDate(
            date_open=today,
            open_time=open_time_obj,
            close_time=close_time_obj,
            is_open=is_open_bool
        )
        db.add(opening)
    
    db.commit()
    db.refresh(opening)
    
    return {
        "id": opening.id,
        "date_open": opening.date_open.isoformat(),
        "open_time": opening.open_time.strftime("%H:%M:%S"),
        "close_time": opening.close_time.strftime("%H:%M:%S"),
        "is_open": opening.is_open,
        "message": "บันทึกเวลาสำเร็จ"
    }


@router.post("/open_shop")
def open_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER]))
):
    """
    เปิดร้านสำหรับวันนี้ (อัพเดต is_open เป็น True)
    """
    today = date.today()
    
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == today).first()
    
    if not opening:
        raise HTTPException(status_code=404, detail="ยังไม่มีการตั้งค่าเวลาเปิด-ปิด")
    
    opening.is_open = True
    db.commit()
    db.refresh(opening)
    
    return {
        "message": "เปิดร้านสำเร็จ",
        "is_open": opening.is_open,
        "open_time": opening.open_time.strftime("%H:%M:%S"),
        "close_time": opening.close_time.strftime("%H:%M:%S")
    }


@router.post("/close_shop")
def close_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER]))
):
    """
    ปิดร้านสำหรับวันนี้ (อัพเดต is_open เป็น False)
    """
    today = date.today()
    
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == today).first()
    
    if not opening:
        raise HTTPException(status_code=404, detail="ยังไม่มีการตั้งค่าเวลาเปิด-ปิด")
    
    opening.is_open = False
    db.commit()
    db.refresh(opening)
    
    return {
        "message": "ปิดร้านสำเร็จ",
        "is_open": opening.is_open
    }