from pydantic import BaseModel
from datetime import datetime,date
from app.model import UserRole

class UserCreateRegister(BaseModel):
    username:str
    password:str
    firstname:str
    lastname: str|None = None
    birthday: date
    email: str
    phone: str
    profile_img: str|None = None

class UserResponseRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    birthday: date
    rolestatus: UserRole
    email: str
    phone: str
    profile_img: str|None = None
    create_at: datetime
    update_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class UserCreateLogin(BaseModel):
    username:str
    password:str

class UserResponseLogin(BaseModel):
    pass
    class Config:
        from_attributes = True

