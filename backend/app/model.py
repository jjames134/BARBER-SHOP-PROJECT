from sqlalchemy import Column, Integer, Time, Boolean, String, ForeignKey, Float, Enum, Date, DateTime,Table,func
from datetime import datetime,date,time
from app.database import Base, engine, get_db
import enum
from sqlalchemy.orm import relationship,Mapped,mapped_column

class BookedStatus(enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    SERVING = "SERVING"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"

class ChairStatus(enum.Enum):
    AVAILABLE = "AVAILABLE"
    FULL = "FULLY"
    CLOSED = "CLOSED"

class UserRole(enum.Enum):
    MEMBER = "MEMBER"
    STAFF = "STAFF"
    OWNER = "OWNER"

class LeaveStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id:Mapped[int] = mapped_column(primary_key=True)
    username:Mapped[str] = mapped_column(String(50),unique=True,nullable=False)
    password_hash:Mapped[str] = mapped_column(String(255),nullable=False)
    firstname:Mapped[str] = mapped_column(String(50),nullable=False)
    lastname:Mapped[str | None] = mapped_column(String(50))
    birthday:Mapped[date] = mapped_column(Date)
    rolestatus:Mapped[UserRole] = mapped_column(Enum(UserRole),default=UserRole.MEMBER)#member barber(staff) owner
    email:Mapped[str] = mapped_column(String(50),unique=True,nullable=False)
    phone:Mapped[str] = mapped_column(String(50),nullable=False)
    profile_img:Mapped[str | None] = mapped_column(String(255))#ใส่path
    create_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    update_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active:Mapped[bool] = mapped_column(Boolean,nullable=False)
    queues:Mapped[list["QueueSlots"]] = relationship(back_populates="customer")

working_slot_table = Table(
    "working_slot_table",
    Base.metadata,
    Column("barber_id",ForeignKey("barbers.id")),
    Column("slot_id",ForeignKey("queue_slots.id"))
    
)


chair_for_date = Table(
    "chair_for_date",
    Base.metadata,
    Column("open_date",ForeignKey("opening_dates.date_work")),
    Column("chair_id",ForeignKey("chairs.id"))
    
)

class Barber(Base):
    __tablename__ = "barbers"

    id:Mapped[int] = mapped_column(primary_key=True)
    user_id:Mapped[int] = mapped_column(ForeignKey("users.id"))
    user_data:Mapped["User"] = relationship(single_parent=True)
    time_working:Mapped[list["QueueSlots"]] = relationship("QueueSlots", secondary=working_slot_table, back_populates="barber_working")
    leave_letter:Mapped[list["LeaveLetter"]] = relationship()
    leave_letter = relationship("LeaveLetter", back_populates="barber")



class Chair(Base):
    __tablename__ = "chairs"

    id:Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    openingdate:Mapped[list["OpeningDate"]] = relationship("OpeningDate", secondary=chair_for_date, back_populates="chairs")
    queues:Mapped[list["QueueSlots"]] = relationship(back_populates="chair")
    status:Mapped[ChairStatus] =  mapped_column(Enum(ChairStatus),default=ChairStatus.AVAILABLE)

class QueueSlots(Base):
    __tablename__ = "queue_slots"

    id:Mapped[int] = mapped_column(primary_key=True)
    open_date:Mapped[date] = mapped_column(Date,nullable=False)
    start_time:Mapped[time] = mapped_column(Time,nullable=False)
    end_time:Mapped[time] = mapped_column(Time,nullable=False)
    chair_id:Mapped[int] = mapped_column(ForeignKey("chairs.id"))
    customer_id:Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    #AVAILABLE, BOOKED, SERVING, CANCELLED, COMPLETED
    status:Mapped[BookedStatus] = mapped_column(Enum(BookedStatus),default=BookedStatus.AVAILABLE)
    barber_working:Mapped[list["Barber"]] = relationship("Barber", secondary=working_slot_table, back_populates="time_working")
    chair:Mapped["Chair"] = relationship(back_populates="queues")
    customer:Mapped["User"] = relationship(back_populates="queues")
   
   
    

class LeaveLetter(Base):
    __tablename__ = "leave_letters"

    id:Mapped[int] = mapped_column(primary_key=True)
    barber_id:Mapped[int] = mapped_column(ForeignKey("barbers.id"))
    report:Mapped[str] = mapped_column(String(255),nullable=False)
    date_leave:Mapped[date] = mapped_column(Date,nullable=False)
    status:Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus),default=LeaveStatus.PENDING)
    create_at:Mapped[datetime] = mapped_column(DateTime,nullable=False)
    barber = relationship("Barber", back_populates="leave_letter")

class OpeningDate(Base):
    __tablename__ = "opening_dates"

    date_work: Mapped[date] = mapped_column(Date, unique=True, primary_key=True, nullable=False)
    open_time:Mapped[time] = mapped_column(Time,nullable=False)
    close_time:Mapped[time] = mapped_column(Time,nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    chairs:Mapped[list["Chair"]] = relationship("Chair", secondary=chair_for_date, back_populates="openingdate")
    
