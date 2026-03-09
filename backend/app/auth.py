from app.security import hash_password, verify_password
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.model import User
from app.schemas import UserResponseRegister,UserCreateRegister,UserCreateLogin
from app.database import get_db
from jose import jwt
from datetime import datetime, timedelta
import os


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data:dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt







router = APIRouter(prefix="/auth",tags=["Auth"])

@router.post("/register",response_model= UserResponseRegister)
def register(user: UserCreateRegister, db:Session = Depends(get_db)):
    exist_user = db.query(User).filter(User.username == user.username).first()
    if exist_user :
        raise HTTPException(status_code=401,detail="Usernameถูกใช้ไปแล้ว")
    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(status_code=401, detail="Emailนี้ถูกใช้ไปแล้ว")
    new_user = User(username=user.username,
                    password_hash=hash_password(user.password),
                    firstname=user.firstname,
                    lastname=user.lastname,
                    birthday=user.birthday,
                    email=user.email,
                    phone=user.phone,
                    is_active=True
                    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(user:UserCreateLogin,db:Session =  Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user :
        raise HTTPException(status_code=401,detail="Usernameไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง")
    if not verify_password(user.password,db_user.password_hash):
        raise HTTPException(status_code=401,detail="Passwordไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง")
    db_user.is_active = True
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = create_access_token(
        data={
            "sub": db_user.username,
            "user_id": db_user.id,
            "role": db_user.rolestatus.value
        }
    )
    return{
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.rolestatus.value
        }
