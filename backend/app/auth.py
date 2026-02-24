from app.security import hash_password, verify_password
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.model import User
from app.schemas import UserResponseRegister,UserCreateRegister,UserCreateLogin
from app.database import get_db

router = APIRouter(prefix="/auth",tags=["Auth"])

@router.post("/register",response_model= UserResponseRegister)
def register(user: UserCreateRegister, db:Session = Depends(get_db)):
    exist_user = db.query(User).filter(User.username == user.username).first()
    if exist_user :
        raise HTTPException(status_code=400,detail="Usernameถูกใช้ไปแล้ว")
    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(status_code=400, detail="Emailนี้ถูกใช้ไปแล้ว")
    new_user = User(username=user.username,
                    password_hash=hash_password(user.password),
                    firstname=user.firstname,
                    lastname=user.lastname,
                    birthday=user.birthday,
                    email=user.email,
                    phone=user.phone,
                    profile_img=user.profile_img,
                    is_active=True
                    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(user:UserCreateLogin,db:Session =  Depends(get_db)):
    db_user = db.query(User).filter(user.username == User.username).first()
    if not db_user :
        raise HTTPException(status_code=400,detail="ไม่มีUsername")
    if not verify_password(user.password,db_user.password_hash):
        raise HTTPException(status_code=400,detail="รหัสผ่านไม่ถูกต้อง")
    db_user.is_active = True
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message":"ล็อกอินสำเร็จ"}
