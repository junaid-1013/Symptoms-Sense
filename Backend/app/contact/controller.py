"""
Contact-form controller.
"""
from fastapi import APIRouter, BackgroundTasks

from app.contact.schema import ContactRequest
from app.contact.service import send_contact_email
from app.core.response import APIResponse

router = APIRouter(prefix="/contact", tags=["contact"])

@router.post("")
async def submit_contact_form(
    payload: ContactRequest,
    background_tasks: BackgroundTasks,
):
    """Accept a contact-form submission and dispatch the notification email asynchronously."""
    background_tasks.add_task(send_contact_email, payload)
    return APIResponse(
        message="Mail Sent Successfully",
        data={"success": True},
    ).model_dump()