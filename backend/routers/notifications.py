from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime
from backend.database import get_db
from backend.models import Notification, User
from backend.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    read: bool
    recipient_role: Optional[str] = None
    recipient_agency: Optional[str] = None
    recipient_id: Optional[int] = None
    permit_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ==========================================
# ENDPOINTS
# ==========================================

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[NotificationResponse]:
    """
    Retrieve all notifications matched to the user's role and agency.
    """
    query = db.query(Notification)

    if current_user.role == "ADMIN":
        # Admins see notifications targeted to ADMIN role
        query = query.filter(Notification.recipient_role == "ADMIN")
    elif current_user.role == "UTILITY":
        # Utilities see notifications targeted to UTILITY role and their agency or user_id
        query = query.filter(
            Notification.recipient_role == "UTILITY",
            (Notification.recipient_agency == current_user.agency_name) | 
            (Notification.recipient_id == current_user.id)
        )
    else:
        # Others (e.g. citizens) do not get in-app dashboard notifications in this workflow
        return []

    return query.order_by(Notification.created_at.desc()).all()


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> NotificationResponse:
    """
    Mark a notification as read.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Access control check
    if current_user.role == "ADMIN" and notification.recipient_role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to access this notification")
    elif current_user.role == "UTILITY":
        if notification.recipient_role != "UTILITY" or (
            notification.recipient_agency != current_user.agency_name and 
            notification.recipient_id != current_user.id
        ):
            raise HTTPException(status_code=403, detail="Not authorized to access this notification")

    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all unread notifications for the current user as read.
    """
    query = db.query(Notification).filter(Notification.read == False)

    if current_user.role == "ADMIN":
        query = query.filter(Notification.recipient_role == "ADMIN")
    elif current_user.role == "UTILITY":
        query = query.filter(
            Notification.recipient_role == "UTILITY",
            (Notification.recipient_agency == current_user.agency_name) | 
            (Notification.recipient_id == current_user.id)
        )
    else:
        return {"message": "No notifications to mark as read"}

    unread_notifications = query.all()
    for notif in unread_notifications:
        notif.read = True
    
    db.commit()
    return {"message": f"Successfully marked {len(unread_notifications)} notifications as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an individual notification.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Access control check
    if current_user.role == "ADMIN" and notification.recipient_role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to delete this notification")
    elif current_user.role == "UTILITY":
        if notification.recipient_role != "UTILITY" or (
            notification.recipient_agency != current_user.agency_name and 
            notification.recipient_id != current_user.id
        ):
            raise HTTPException(status_code=403, detail="Not authorized to delete this notification")

    db.delete(notification)
    db.commit()
    return None
