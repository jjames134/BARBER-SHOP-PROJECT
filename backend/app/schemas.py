from pydantic import BaseModel,EmailStr, Field
from datetime import datetime,date,time
from app.model import UserRole,BookedStatus,TypeUser,LeaveStatus,NotificationType,CategoryImg,PreUserStatus
from typing import Optional
from typing import List


class UserCreateRegister(BaseModel):
    email: str
    otp: str


class OTPVerifyRequest(BaseModel):
    email: str
    otp: str
    purpose: PreUserStatus

class UserResponseRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    rolestatus: UserRole
    email: EmailStr
    phone: str
    create_at: datetime
    update_at: datetime
    

    class Config:
        from_attributes = True

class UserCreateLogin(BaseModel):
    username:str
    password: str = Field(min_length=8)

class UserResponseLogin(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    
    class Config:
        from_attributes = True




class QueueResponse(BaseModel):
    id: int
    start_time: time
    end_time: time
    chair_id: int
    customer_id: Optional[int]
    date_working: date
    status: BookedStatus
    status_user: TypeUser


    class Config:
        from_attributes = True

class ChairCreate(BaseModel):
    chair_name: str


class ChairResponse(BaseModel):
    id:int
    name:str

class OpenDateCreate(BaseModel):
    date_open: date
    open_time: time
    close_time: time
    is_open: bool


class OpenDateResponse(BaseModel):
    id: int
    date_open: date
    open_time: time
    close_time: time
    is_open: bool

    class Config:
        from_attributes = True

class UserCreatePreRegister(BaseModel):
    username:str
    password: str = Field(min_length=8)
    firstname:str
    lastname: str|None = None
    email: EmailStr
    phone: str

class UserResponsePreRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    email: EmailStr
    phone: str
    is_verified: bool

    class Config:
        from_attributes = True

class UserUpdateProfile(BaseModel):
    username: Optional[str] = None # <--- เพิ่มตัวนี้
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    profile_img: Optional[str] = None

class UserChangePassword(BaseModel):
    old_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)

class LetterCreate(BaseModel):
    report:str
    date_leave:date

# 1. สร้าง Schema สำหรับ User ข้อมูลพื้นฐาน (เพื่อส่งไปกับ Barber)
class UserInBarberResponse(BaseModel):
    id: int
    username: str
    firstname: str
    lastname: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True

# 2. สร้าง BarberResponse (คลาสนี้ต้องอยู่ก่อน LetterResponse)
class BarberResponse(BaseModel):
    id: int
    user_id: int
    user_data: Optional[UserInBarberResponse] = None # ดึงข้อมูลจาก Relationship user_data

    class Config:
        from_attributes = True

# 3. แก้ไข LetterResponse ให้เรียกใช้ BarberResponse ที่สร้างไว้
class LetterResponse(BaseModel):
    id: int
    date_leave: date
    report: str
    status: str
    # ตอนนี้ระบบจะรู้จัก BarberResponse แล้ว และจะส่งข้อมูล barber -> user_data ไปให้
    barber: Optional[BarberResponse] = None 

    class Config:
        from_attributes = True

# ═══════════════════════════════════════════
# SHOP SETTING
# ═══════════════════════════════════════════
 
class CustomeIMgWebsiteUpdate(BaseModel):
    path_img    : Optional[str]=None
    cate        : Optional[CategoryImg]=None
 
class CustomeIMgWebsiteResponse(BaseModel):
    id         : int
    path_img    : Optional[str]=None
    cate        : Optional[CategoryImg]=None
 
    class Config:
        from_attributes = True

class DescriptionUpdate(BaseModel):
    massege : Optional[str] = None

class DescriptionResponse(BaseModel):
    id :int
    massege : Optional[str] = None
 
class PageViewCreate(BaseModel):
    session_id: str   # uuid สร้างจาก frontend
    path      : str   # เช่น "/", "/queue", "/profile"

# ═══════════════════════════════════════════
# NOTIFICATION
# ═══════════════════════════════════════════
 
class NotificationResponse(BaseModel):
    id       : int
    type     : NotificationType
    title    : str
    message  : str
    is_read  : bool
    ref_id   : Optional[int]
    create_at: datetime
 
    class Config:
        from_attributes = True

class PasswordVerify(BaseModel):
    password: str

class ResetPassworld(BaseModel):
    email: str
    new_password: str

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse] # รายการแจ้งเตือนทั้งหมด
    unread_count: int                 # จำนวนที่ยังไม่ได้อ่าน

    class Config:
        from_attributes = True