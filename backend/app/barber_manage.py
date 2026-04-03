from fastapi import APIRouter,Depends,HTTPException,Header
from app.database import get_db
from sqlalchemy.orm import Session
from app.model import Chair, OpeningDate, QueueSlots,User,BookedStatus,TypeUser,UserRole,Barber,LeaveStatus,LeaveLetter
from app.rolebase import require_roles,require_barber
from datetime import date
from app.schemas import LetterResponse,LetterCreate
from datetime import datetime
from sqlalchemy.orm import joinedload
from app.notification_service import notify_leave_approved, notify_leave_rejected, notify_requeste

router = APIRouter(prefix="/barber_manage",tags=["Barber_Manage"])

@router.get("/barber_view")
def getBarber(db: Session = Depends(get_db), user: User = Depends(require_roles([UserRole.OWNER]))):
    # ใช้ joinedload เพื่อดึงข้อมูลจากตาราง User (user_data) มาพร้อมกัน
    barber_table = db.query(Barber).options(joinedload(Barber.user_data)).all()
    
    if not barber_table:
        raise HTTPException(status_code=404, detail="ไม่พบพนักงาน")
        
    return barber_table

@router.post("/assign_chair")
def assign_chair(
    chair_id: int,
    barber_id: int,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db),
):
    # 1. Load chair
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    # 2. Load barber
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(404, "Barber not found")

    # --- เพิ่มส่วนการเช็กคนลาตรงนี้ ---
    # 3. เช็กว่าช่างคนนี้มีใบลาที่อนุมัติแล้วในวันนี้หรือไม่
    today = date.today()
    leave_record = db.query(LeaveLetter).filter(
        LeaveLetter.barber_id == barber_id,
        LeaveLetter.date_leave == today,
        LeaveLetter.status == LeaveStatus.APPROVED
    ).first()

    if leave_record:
        raise HTTPException(400, f"Cannot assign: Barber is on leave today ({leave_record.report})")
    # ------------------------------

    # 4. กัน assign ซ้ำเก้าอี้
    if chair.barber_id is not None:
        raise HTTPException(400, "Chair already assigned to someone else")

    # 5. กัน barber มีหลายเก้าอี้
    existing = db.query(Chair).filter(
        Chair.barber_id == barber_id
    ).first()

    if existing:
        raise HTTPException(400, "Barber already has a chair")

    # 6. Assign
    chair.barber_id = barber_id

    try:
        db.commit()
        db.refresh(chair)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Database error: {str(e)}")

    return {
        "message": "Chair assigned successfully",
        "chair_id": chair.id,
        "barber_id": barber_id,
        "barber_name": f"{barber.user_data.firstname} {barber.user_data.lastname}"
    }

@router.post("/unassign_chair")
def unassign_chair(
    chair_id: int,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db)
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    if chair.barber_id is None:
        raise HTTPException(400, "Chair is already empty")

    chair.barber_id = None

    try:
        db.commit()
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return {"message": "Chair unassigned"}

@router.post("/send_leave_letter", response_model=LetterResponse)
def send_leave_letter(
    data: LetterCreate,
    user: User = Depends(require_roles([UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    # 1. ค้นหา Barber จาก User ที่ Login อยู่
    barber = db.query(Barber).filter(Barber.user_id == user.id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    # 2. เช็กว่าลาซ้ำวันเดิมไหม
    existing = db.query(LeaveLetter).filter(
        LeaveLetter.barber_id == barber.id,
        LeaveLetter.date_leave == data.date_leave
    ).first()
    if existing:
        raise HTTPException(400, "Already requested for this date")

    # 3. สร้างจดหมายลาใหม่
    new_letter = LeaveLetter(
        barber_id=barber.id,
        report=data.report,
        date_leave=data.date_leave,
        status=LeaveStatus.PENDING
    )
    db.add(new_letter)
    db.flush() # เพื่อเอา ID ของ new_letter มาใช้แจ้งเตือน

    # 🔔 4. ส่งการแจ้งเตือนไปยังเจ้าของร้าน (Owner)
    # หมายเหตุ: คุณต้องหา user_id ของคนที่เป็น OWNER 
    owner = db.query(User).filter(User.rolestatus == "OWNER").first()
    if owner:
        notify_requeste(
            db=db, 
            user_id=owner.id, # ส่งให้เจ้าของร้าน
            letter_id=new_letter.id, 
            date_leave=data.date_leave
        )

    db.commit() # บันทึกทั้งจดหมายลาและการแจ้งเตือนพร้อมกัน
    db.refresh(new_letter)
    return new_letter

@router.get("/leave_letter", response_model=list[LetterResponse])
def getAllLetter(db: Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    letters = db.query(LeaveLetter).options(
    joinedload(LeaveLetter.barber).joinedload(Barber.user_data)
).all()
    if not letters:
        raise HTTPException(404,"Not Found Letter")
    return letters

@router.get("/leave_letter/{letter_id}")
def getLetter(letter_id:int,db: Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    letter = db.query(LeaveLetter).options(
    joinedload(LeaveLetter.barber).joinedload(Barber.user_data)
).filter(LeaveLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(404,"Not Found Letter")
    return letter

@router.patch("/leave_letter/{letter_id}/approved")
def approvedLetter(letter_id:int,db: Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    letter = db.query(LeaveLetter).filter(LeaveLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(404,"Not Found Letter")
    if letter.status == LeaveStatus.APPROVED:
        raise HTTPException(400,"จดหมายถูกอนุมัติไปแล้ว")
    if letter.status == LeaveStatus.REJECTED:
        raise HTTPException(400,"จดหมายถูกปฎิเสธคำขอไปแล้ว")
    letter.status = LeaveStatus.APPROVED
    barber = db.query(Barber).filter(Barber.id == letter.barber_id).first()
    if barber:
        notify_leave_approved(db, barber.user_id, letter.id, str(letter.date_leave))
    db.commit()
    return {"message": "Approved successfully"}

@router.patch("/leave_letter/{letter_id}/rejected")
def rejectedLettter(letter_id:int,db: Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    letter = db.query(LeaveLetter).filter(LeaveLetter.id == letter_id).first()
    if not letter:
        raise HTTPException(404,"Not Found Letter")
    if letter.status == LeaveStatus.APPROVED:
        raise HTTPException(400,"จดหมายถูกอนุมัติไปแล้ว")
    if letter.status == LeaveStatus.REJECTED:
        raise HTTPException(400,"จดหมายถูกปฎิเสธคำขอไปแล้ว")
    letter.status = LeaveStatus.REJECTED
    barber = db.query(Barber).filter(Barber.id == letter.barber_id).first()
    if barber:
        notify_leave_rejected(db, barber.user_id, letter.id, str(letter.date_leave))
    db.commit()
    return {"message": "Rejected successfully"}

@router.get("/customer")
def getAllCustomer(db: Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    customer_table = db.query(User).filter(User.rolestatus == UserRole.CUSTOMER).all()
    if not customer_table:
        raise HTTPException(404,"ไม่พบลูกค้า")
    return customer_table

@router.post("/grant/{user_id}")
def grant_employee(
    user_id: int,
    db     : Session = Depends(get_db),
    user   : User    = Depends(require_roles([UserRole.OWNER])),
):
    """เพิ่มผู้ใช้เป็นพนักงาน"""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    if target.rolestatus != UserRole.CUSTOMER:
        raise HTTPException(400, "User ต้องเป็น CUSTOMER")
 
    target.rolestatus = UserRole.EMPLOYEE
    new_barber = Barber(user_id=target.id)
    db.add(new_barber)
    try:
        db.commit()
        db.refresh(new_barber)
    except Exception:
        db.rollback()
        raise HTTPException(500, "Database error")
    return {"message": "User promoted to employee", "barber_id": new_barber.id}

@router.post("/revoke/{barber_id}")
def revoke_employee(barber_id:int,db: Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(404, "Barber not found")
    chair = db.query(Chair).filter(Chair.barber_id == barber.id).first()
    if chair:
         chair.barber_id = None
    target = db.query(User).filter(User.id == barber.user_id).first()
    target.rolestatus = UserRole.CUSTOMER
    db.delete(barber)
    try:
        db.commit()
    except:
        db.rollback()
        raise HTTPException(500, "Database error")
    return {"message": "Employee revoked"}

@router.get("/all_users")
def get_all_users(
    db  : Session = Depends(get_db),
    user: User    = Depends(require_roles([UserRole.OWNER])),
):
    """ดูผู้ใช้ทั้งหมด (ตาม wireframe Manage User)"""
    users = db.query(User).order_by(User.create_at.desc()).all()
    return [
        {
            "id"         : u.id,
            "username"   : u.username,
            "firstname"  : u.firstname,
            "lastname"   : u.lastname,
            "email"      : u.email,
            "phone"      : u.phone,
            "rolestatus" : u.rolestatus.value,
            "profile_img": u.profile_img,
            "create_at"  : u.create_at,
        }
        for u in users
    ]

@router.post("/update_leave_status/{letter_id}")
def update_status(letter_id: int, status: LeaveStatus, db: Session = Depends(get_db)):
    letter = db.query(LeaveLetter).filter(LeaveLetter.id == letter_id).first()
    if not letter: raise HTTPException(404)
    
    letter.status = status
    
    # 🔔 เรียกใช้ Proxy ส่งแจ้งเตือนกลับไปหาพนักงาน
    if status == LeaveStatus.APPROVED:
        notify_leave_approved(db, letter.barber.user_id, letter.id, str(letter.date_leave))
    elif status == LeaveStatus.REJECTED:
        notify_leave_rejected(db, letter.barber.user_id, letter.id, str(letter.date_leave))
        
    db.commit()
    return {"message": "Success"}