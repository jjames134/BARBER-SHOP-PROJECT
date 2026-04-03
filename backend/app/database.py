import os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base,sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus

import pymysql

pymysql.install_as_MySQLdb()

load_dotenv()

Base = declarative_base()


def _normalize_database_url(raw_url: str) -> str:
    # Clean up values copied from dashboard UIs (quotes/newlines/spaces).
    url = raw_url.strip().strip('"').strip("'")

    # Fail fast on unresolved template variables.
    if "${" in url or "{{" in url:
        raise RuntimeError(
            "Database URL looks like a template placeholder. "
            "Set a real DATABASE_URL value in deployment variables."
        )

    # Normalize driver prefixes for SQLAlchemy.
    if url.startswith("mysql://"):
        return "mysql+pymysql://" + url[len("mysql://"):]
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        return "postgresql+psycopg2://" + url[len("postgresql://"):]

    return url


def _resolve_database_url() -> str:
    # Prefer a full URL when provided by platform secrets.
    url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL")
    if url:
        return _normalize_database_url(url)

    # Fallback: compose URL from common Railway/MySQL env var names.
    host = os.getenv("MYSQLHOST") or os.getenv("DB_HOST")
    port = os.getenv("MYSQLPORT") or os.getenv("DB_PORT") or "3306"
    user = os.getenv("MYSQLUSER") or os.getenv("DB_USER")
    password = os.getenv("MYSQLPASSWORD") or os.getenv("DB_PASSWORD")
    database = os.getenv("MYSQLDATABASE") or os.getenv("DB_NAME")

    if all([host, user, password, database]):
        return (
            f"mysql+pymysql://{quote_plus(user)}:{quote_plus(password)}"
            f"@{host}:{port}/{database}"
        )

    raise RuntimeError(
        "Database configuration missing. Set DATABASE_URL (or MYSQL_URL), "
        "or provide MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE."
    )


class DatabaseSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseSingleton, cls).__new__(cls)
            database_url = _resolve_database_url()
            cls._instance.engine = create_engine(database_url, pool_pre_ping=True)
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



