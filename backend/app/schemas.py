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


class UserResponseRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    birthday: date
    rolestatus: UserRole
    email: str
    phone: str
    create_at: datetime
    update_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True

class UserCreateLogin(BaseModel):
    username:str
    password:str

class UserResponseLogin(BaseModel):
    username:str
    is_active: bool = True
    
    class Config:
        from_attributes = True
