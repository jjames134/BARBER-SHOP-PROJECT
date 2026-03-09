from sqlalchemy import UniqueConstraint,Column, Integer, Time, Boolean, String, ForeignKey, Float, Enum, Date, DateTime,Table,func
from datetime import datetime,date,time
from app.database import Base, engine, get_db
import enum
from sqlalchemy.orm import relationship,Mapped,mapped_column

class BookedStatus(enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    CHECKIN = "CHECKIN"
    CANCELLED = "CANCELLED"
    COMPLETE = "COMPLETE"
    NO_SHOW = "NO_SHOW"

class ChairStatus(enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    FULL = "FULL"
    CLOSED = "CLOSED"

class TypeUser(enum.Enum):
    WALK_IN = "WALK_IN"
    ONLINE = "ONLINE"
    NONE = "NONE"

class UserRole(enum.Enum):
    CUSTOMER = "CUSTOMER"
    EMPLOYEE = "EMPLOYEE"
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
    rolestatus:Mapped[UserRole] = mapped_column(Enum(UserRole),default=UserRole.CUSTOMER)#member barber(staff) owner
    email:Mapped[str] = mapped_column(String(50),unique=True,nullable=False)
    phone:Mapped[str] = mapped_column(String(50),nullable=False)
    profile_img:Mapped[str | None] = mapped_column(String(255))#ใส่path
    create_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    update_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    queues:Mapped[list["QueueSlots"]] = relationship(back_populates="customer")

barber_queue_slots = Table(
    "barber_queue_slots",
    Base.metadata,
    Column("barber_id",ForeignKey("barbers.id")),
    Column("slot_id",ForeignKey("queue_slots.id"))
    
)




class Barber(Base):
    __tablename__ = "barbers"

    id:Mapped[int] = mapped_column(primary_key=True)
    user_id:Mapped[int] = mapped_column(ForeignKey("users.id"))
    user_data:Mapped["User"] = relationship(single_parent=True)
    time_working:Mapped[list["QueueSlots"]] = relationship("QueueSlots", secondary=barber_queue_slots, back_populates="barber_working")
    leave_letter:Mapped[list["LeaveLetter"]] = relationship("LeaveLetter", back_populates="barber")



class Chair(Base):
    __tablename__ = "chairs"

    id:Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    date_working:Mapped[date] = mapped_column(ForeignKey("opening_dates.date_open"))
    queues:Mapped[list["QueueSlots"]] = relationship(back_populates="chair")
    status:Mapped[ChairStatus] =  mapped_column(Enum(ChairStatus),default=ChairStatus.AVAILABLE)
    opening_date: Mapped["OpeningDate"] = relationship(back_populates="chairs")

class QueueSlots(Base):
    __tablename__ = "queue_slots"

    id:Mapped[int] = mapped_column(primary_key=True)
    start_time:Mapped[time] = mapped_column(Time,nullable=False)
    end_time:Mapped[time] = mapped_column(Time,nullable=False)
    chair_id:Mapped[int] = mapped_column(ForeignKey("chairs.id"))
    date_working:Mapped[date] = mapped_column(ForeignKey("opening_dates.date_open"))
    customer_id:Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    #AVAILABLE, BOOKED, SERVING, CANCELLED, COMPLETED
    status:Mapped[BookedStatus] = mapped_column(Enum(BookedStatus),default=BookedStatus.AVAILABLE)
    status_user:Mapped[TypeUser] = mapped_column(Enum(TypeUser),default=TypeUser.NONE)
    barber_working:Mapped[list["Barber"]] = relationship("Barber", secondary=barber_queue_slots, back_populates="time_working")
    chair:Mapped["Chair"] = relationship(back_populates="queues")
    customer:Mapped["User"] = relationship(back_populates="queues")
    __table_args__ = (UniqueConstraint("chair_id", "date_working", "start_time"),)
   
   
    

class LeaveLetter(Base):
    __tablename__ = "leave_letters"

    id:Mapped[int] = mapped_column(primary_key=True)
    barber_id:Mapped[int] = mapped_column(ForeignKey("barbers.id"))
    report:Mapped[str] = mapped_column(String(255),nullable=False)
    date_leave:Mapped[date] = mapped_column(Date, default=date.today)
    status:Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus),default=LeaveStatus.PENDING)
    create_at:Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    barber = relationship("Barber", back_populates="leave_letter")

class OpeningDate(Base):
    __tablename__ = "opening_dates"

    date_open: Mapped[date] = mapped_column(default=date.today, nullable=False,primary_key=True)
    open_time:Mapped[time] = mapped_column(Time,nullable=False)
    close_time:Mapped[time] = mapped_column(Time,nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    chairs:Mapped[list["Chair"]] = relationship("Chair", back_populates="opening_date")
    
