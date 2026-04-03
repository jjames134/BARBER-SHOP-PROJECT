from fastapi import Depends, HTTPException
from app.model import UserRole, User
from app.backtask import get_current_user
from typing import List
 
BARBER_ROLES = [
    UserRole.OWNER,
    UserRole.EMPLOYEE
]
 
def require_roles(roles: List[UserRole]):
    def checker(user: User = Depends(get_current_user)):
        if user.rolestatus not in roles:
            raise HTTPException(status_code=403, detail="Unauthorized")
        return user
    return checker
 
def require_barber():
    def checker(user: User = Depends(get_current_user)):
        if user.rolestatus not in [UserRole.OWNER, UserRole.EMPLOYEE]:
            raise HTTPException(status_code=403, detail="Not barber")
 
        if not user.barber:
            raise HTTPException(status_code=403, detail="No barber profile")
 
        return user
    return checker