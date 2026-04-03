import os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base,sessionmaker
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()
class DatabaseSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseSingleton, cls).__new__(cls)
            # โหลด URL จาก env
            DATABASE_URL = os.getenv("DATABASE_URL")
            cls._instance.engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            cls._instance.SessionLocal = sessionmaker(
                autocommit=False, autoflush=False, bind=cls._instance.engine
            )
        return cls._instance
# --- ส่วนที่เพิ่ม/แก้ไขเพื่อให้ main.py เรียกใช้ได้ ---
# สร้าง instance ของ Singleton
db_singleton = DatabaseSingleton()

# ประกาศตัวแปร engine ไว้ระดับ global เพื่อให้ main.py import ไปใช้ได้ (Base.metadata.create_all(engine))
engine = db_singleton.engine
SessionLocal = db_singleton.SessionLocal

# ใช้งานผ่าน helper เดิมเพื่อให้กระทบโค้ดส่วนอื่นน้อยที่สุด
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



