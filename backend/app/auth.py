from app.security import hash_password, verify_password
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.model import User, PreUser, PreUserStatus, RefreshToken, UserRole
from app.schemas import (
    UserResponseRegister, UserCreateRegister, UserCreateLogin,
    UserCreatePreRegister, UserResponsePreRegister,
    UserUpdateProfile, UserChangePassword, ResetPassworld,
    OTPVerifyRequest,PasswordVerify
)
from app.database import get_db
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
from app.email_service import send_otp_email, generate_otp
from app.backtask import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 180


# =========================
# 🔥 HELPER (แก้ timezone)
# =========================
def to_utc(dt):
    if not dt:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# =========================
# TOKEN
# =========================
def create_access_token(data: dict):
    try:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_refresh_token():
    import secrets
    return secrets.token_urlsafe(64)


# =========================
# OTP
# =========================
@router.post("/send_OTP")
def sendOTP(email: str, purpose: PreUserStatus, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    pre_user = db.query(PreUser).filter(
        PreUser.email == email,
        PreUser.purpose == purpose
    ).first()

    if not pre_user:
        pre_user = PreUser(
            email=email,
            username="",
            password_hash="",
            firstname="",
            phone="",
            purpose=purpose
        )
        db.add(pre_user)

    if pre_user.otp_expire and to_utc(pre_user.otp_expire) > now:
        raise HTTPException(status_code=400, detail="กรุณารอก่อนขอ OTP ใหม่")

    OTP = generate_otp()
    pre_user.otp_code = hash_password(OTP)
    pre_user.otp_expire = now + timedelta(minutes=5)
    pre_user.otp_attempts = 0

    db.commit()
    send_otp_email(email, OTP)

    return {"message": "OTP sent"}


def verify_otp_internal(email: str, pin: str, purpose: PreUserStatus, db: Session):
    pre_user = db.query(PreUser).filter(
        PreUser.email == email,
        PreUser.purpose == purpose
    ).first()

    if not pre_user:
        raise HTTPException(status_code=404, detail="ไม่พบ email")

    if pre_user.otp_attempts >= 5:
        raise HTTPException(status_code=429, detail="พยายามมากเกินไป")

    otp_expire = to_utc(pre_user.otp_expire)
    now = datetime.now(timezone.utc)

    if not otp_expire or otp_expire < now:
        raise HTTPException(status_code=401, detail="OTP หมดอายุ")

    if pre_user.is_verified:
        raise HTTPException(status_code=400, detail="OTP ถูกใช้ไปแล้ว")

    if not pre_user.otp_code:
        raise HTTPException(status_code=400, detail="OTP ไม่ถูกต้องหรือหมดอายุ")

    try:
        is_valid = verify_password(pin, pre_user.otp_code)
    except Exception as e:
        print("VERIFY ERROR:", e)
        raise HTTPException(status_code=500, detail="OTP verify error")

    if not is_valid:
        pre_user.otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=401, detail="OTP ไม่ถูกต้อง")

    pre_user.is_verified = True
    pre_user.otp_code = None
    db.commit()

    return pre_user


@router.post("/verify_OTP")
def verify_otp_endpoint(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    verify_otp_internal(data.email, data.otp, data.purpose, db)
    return {
        "message": "OTP verified",
        "email": data.email,
        "verified": True
    }


# =========================
# REGISTER / LOGIN
# =========================
@router.post("/register", response_model=UserResponseRegister)
def register(user: UserCreateRegister, db: Session = Depends(get_db)):
    pre_user = db.query(PreUser).filter(
        PreUser.email == user.email,
        PreUser.purpose == PreUserStatus.REGISTER
    ).first()

    if not pre_user:
        raise HTTPException(status_code=401, detail="ไม่พบ pre-register")

    if not pre_user.is_verified:
        raise HTTPException(status_code=401, detail="ยังไม่ได้ยืนยัน OTP")

    new_user = User(
        username=pre_user.username,
        password_hash=pre_user.password_hash,
        firstname=pre_user.firstname,
        lastname=pre_user.lastname,
        email=pre_user.email,
        phone=pre_user.phone
    )

    db.add(new_user)
    db.delete(pre_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login(user: UserCreateLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({
        "sub": db_user.username,
        "user_id": db_user.id,
        "role": db_user.rolestatus.value
    })

    refresh_token = create_refresh_token()

    db_token = RefreshToken(
        user_id=db_user.id,
        jti=refresh_token,
        token_hash=hash_password(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )

    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# =========================
# PRE REGISTER
# =========================
@router.post("/pre_register", response_model=UserResponsePreRegister)
def pre_register(user: UserCreatePreRegister, db: Session = Depends(get_db)):

    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Usernameถูกใช้ไปแล้ว")

    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Emailนี้ถูกใช้ไปแล้ว")

    if db.query(PreUser).filter(
        PreUser.email == user.email,
        PreUser.purpose == PreUserStatus.REGISTER
    ).first():
        raise HTTPException(status_code=400, detail="กรุณายืนยัน OTP ก่อนสมัครใหม่")

    OTP = generate_otp()

    new_user = PreUser(
        username=user.username,
        password_hash=hash_password(user.password),
        firstname=user.firstname,
        lastname=user.lastname,
        email=user.email,
        phone=user.phone,
        otp_code=hash_password(OTP),
        otp_expire=datetime.now(timezone.utc) + timedelta(minutes=5),
        is_verified=False,
        purpose=PreUserStatus.REGISTER
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_otp_email(new_user.email, OTP)

    return new_user


# =========================
# PROFILE
# =========================
@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    # ดึง barber_id ถ้า user คนนี้เป็นช่าง
    # สมมติว่าความสัมพันธ์ใน Model คือ current_user.barber
    barber_id = current_user.barber.id if current_user.barber else None
    
    return {
        "id": current_user.id, # ID ของ User
        "barber_id": barber_id, # ID ของ Barber (ที่ใช้ผูกกับเก้าอี้)
         "profile_img": current_user.profile_img or "",
         "email": current_user.email,
        "username": current_user.username,
        "firstname": current_user.firstname or "",
        "lastname": current_user.lastname or "",
         "phone": current_user.phone or "",
        "rolestatus": current_user.rolestatus.value if current_user.rolestatus else None
        # ... ข้อมูลอื่นๆ
    }

@router.patch("/edit_info")
def edit_info(
    data: UserUpdateProfile, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # 1. ตรวจสอบถ้ามีการเปลี่ยน username
    if data.username and data.username != current_user.username:
        # เช็คว่า username ใหม่ซ้ำกับคนอื่นไหม
        existing_user = db.query(User).filter(User.username == data.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="ชื่อผู้ใช้นี้ถูกใช้งานแล้ว")
        current_user.username = data.username

    # 2. อัปเดตฟิลด์อื่นๆ
    if data.firstname is not None: current_user.firstname = data.firstname
    if data.lastname is not None: current_user.lastname = data.lastname
    if data.phone is not None: current_user.phone = data.phone
    if data.profile_img is not None: current_user.profile_img = data.profile_img

    try:
        db.commit()
        db.refresh(current_user)
        return {"message": "Update success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถอัปเดตข้อมูลได้")
    

@router.patch("/change_password")
def change_password(
    data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="รหัสผ่านเดิมไม่ถูกต้อง")

    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="ห้ามใช้รหัสเดิม")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "เปลี่ยนรหัสผ่านสำเร็จ"}


# =========================
# REFRESH (เวอร์ชันปรับปรุง)
# =========================
@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    # 1. ค้นหา Token
    db_token = db.query(RefreshToken).filter(
        RefreshToken.jti == refresh_token
    ).first()

    # 2. ตรวจสอบความถูกต้อง
    if not db_token or db_token.is_revoked:
        raise HTTPException(status_code=401, detail="Refresh token is invalid or revoked")

    # 3. ตรวจสอบวันหมดอายุ
    if to_utc(db_token.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # --- ส่วนที่แนะนำให้ปรับปรุง ---
    # แทนที่จะลบทันที เราอาจจะปล่อยไว้ก่อน หรือลบตัวเก่าทิ้งไปเลย
    # เพื่อความปลอดภัยสูงสุด: ลบตัวเก่าทิ้ง (หรือ Revoke)
    db_token.is_revoked = True 
    
    # 4. สร้าง Access Token ใหม่
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if user:
        user.last_activity = datetime.now(timezone.utc) # รีเซ็ตเวลา Inactivity เมื่อ Refresh สำเร็จ
        db.commit()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({
        "sub": user.username,
        "user_id": user.id,
        "role": user.rolestatus.value
    })

    # 5. สร้าง Refresh Token ใหม่ (Rotate Token)
    new_refresh = create_refresh_token()
    new_db_token = RefreshToken(
        user_id=db_token.user_id,
        jti=new_refresh,
        token_hash=hash_password(new_refresh), # เก็บ hash ไว้ตรวจสอบ
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )

    db.add(new_db_token)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error during refresh")

    return {
        "access_token": new_access,
        "refresh_token": new_refresh
    }


# =========================
# LOGOUT
# =========================
@router.post("/logout")
def logout(refresh_token: str, db: Session = Depends(get_db)):
    db_token = db.query(RefreshToken).filter(
        RefreshToken.jti == refresh_token,
        RefreshToken.is_revoked == False
    ).first()

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_token.is_revoked = True
    db.commit()

    return {"message": "Logged out"}

@router.post("/verify_owner_password")
def verify_owner_password(
    data: PasswordVerify,  # รับเป็น Model เพื่อให้อ่านจาก Body
    current_user: User = Depends(get_current_user)
):
    if current_user.rolestatus != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์")

    # ใช้ data.password แทน password
    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="รหัสผ่านไม่ถูกต้อง")

    return {"message": "password correct"}

@router.post("/reset_password")
def resetpass (data:ResetPassworld,db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user :
        raise HTTPException(status_code=404,detail="Not User")
    user.password_hash = hash_password(data.new_password)
    preuser = db.query(PreUser).filter(PreUser.email == data.email).first()
    if preuser:
        db.delete(preuser)
    db.commit()

@router.post("/verify_password")
def verify_owner_password(
    data: PasswordVerify,  # รับเป็น Model เพื่อให้อ่านจาก Body
    current_user: User = Depends(get_current_user)
):

    # ใช้ data.password แทน password
    if not verify_password(data.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="รหัสผ่านไม่ถูกต้อง")

    return {"message": "password correct"}