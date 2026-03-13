from fastapi import APIRouter,Depends,HTTPException
from app.database import get_db
from sqlalchemy.orm import Session
from app.model import Chair, OpeningDate, QueueSlots,User,BookedStatus,TypeUser,UserRole,Barber
from datetime import date
from app.schemas import QueueResponse

router = APIRouter(prefix="/queue_service",tags=["Queue_Service"])

@router.get("/chairs")
def viewChairs(dateshop:date = date.today(),db:Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    chairs = opening.chairs
    return {
        "date": dateshop,
        "open_time": opening.open_time,
        "close_time": opening.close_time,
        "chairs": chairs
    }

@router.get("/chairs/{chair_id}/queues", response_model=list[QueueResponse])
def viewChair(chair_id: int,dateshop:date = date.today(), db: Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")
    queues_slot = db.query(QueueSlots).filter( QueueSlots.chair_id == chair.id,QueueSlots.date_working == dateshop).all()
    return queues_slot

@router.get("/barber/{barber_id}/queues", response_model=list[QueueResponse])
def viewWorkingTable(barber_id: int,dateshop:date = date.today(), db: Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber table working time not found")
    queues_slot = db.query(QueueSlots).filter( QueueSlots.barber_id == barber.id,QueueSlots.date_working == dateshop).all()
    return queues_slot



@router.post("/queues/{queue_id}/booked", response_model=QueueResponse)
def bookedQueuesByCustomer(chair_id:int,user_id:int,queue_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id,User.rolestatus == UserRole.CUSTOMER).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    if queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Queue already booked")
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")
    if queue.chair_id != chair.id:
        raise HTTPException(status_code=400, detail="Queue not in this chair")
    queue.customer_id = user.id
    queue.status = BookedStatus.BOOKED
    queue.status_user = TypeUser.ONLINE
    db.commit()
    db.refresh(queue)
    return queue

@router.post("/barber/{barber_id}/queues/{queue_id}/booked", response_model=QueueResponse)
def bookedQueuesByBarber(barber_id:int,queue_id:int, db: Session = Depends(get_db)):
    barber = db.query(Barber).join(User).filter(Barber.id == barber_id,User.rolestatus != UserRole.CUSTOMER).first()
    if not barber:
        raise HTTPException(status_code=404, detail="User not found")
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    if queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Queue already booked")
    queue.customer_id = barber.user_id
    queue.status = BookedStatus.BOOKED
    queue.status_user = TypeUser.WALK_IN
    db.commit()
    db.refresh(queue)
    return queue


@router.post("/queues/{queue_id}/cancel", response_model=QueueResponse)
def cancelByCustomer( queue_id:int, user_id:int, db: Session = Depends(get_db)):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    if queue.customer_id != user_id:
        raise HTTPException(status_code=403, detail="Not your queue")
    if queue.status != BookedStatus.BOOKED:
        raise HTTPException(status_code=400, detail="Queue cannot be cancelled")
    queue.status = BookedStatus.CANCELLED
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    db.commit()
    db.refresh(queue)
    return queue

@router.post("/barber/{barber_id}/queues/{queue_id}/cancel")
def cancelByBarber(barber_id:int, queue_id:int, db: Session = Depends(get_db)):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    queue.status = BookedStatus.CANCELLED
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    db.commit()
    return {"message":"Queue cancelled"}

@router.post("/system/queues/{queue_id}/auto/cancel")
def cancelByAuto(queue_id:int, db: Session = Depends(get_db)):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    queue.status = BookedStatus.NO_SHOW
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    db.commit()
    return {"message":"Queue marked as NO_SHOW"}

@router.post("/barber/{barber_id}/queues/{queue_id}/checkin")
def checkin(barber_id:int, queue_id:int, db: Session = Depends(get_db)):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if queue.barber_id != barber_id:
        raise HTTPException(status_code=403, detail="Not your queue")
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    if queue.status != BookedStatus.BOOKED:
        raise HTTPException(status_code=400, detail="Queue cannot checkin")
    queue.status = BookedStatus.CHECKIN
    db.commit()
    return {"message":"Customer checked in"}

@router.post("/barber/{barber_id}/queues/{queue_id}/complete")
def checkout(barber_id:int, queue_id:int, db: Session = Depends(get_db)):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).first()
    if queue.barber_id != barber_id:
        raise HTTPException(status_code=403, detail="Not your queue")
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    if queue.status != BookedStatus.CHECKIN:
        raise HTTPException(status_code=400, detail="Queue not ready to complete")
    queue.status = BookedStatus.COMPLETE
    db.commit()
    return {"message":"Service completed"}
