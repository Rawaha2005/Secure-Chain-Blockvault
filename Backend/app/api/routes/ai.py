from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.db.models import User
from app.services.ai_service import ai_investigator
from app.services.custody_service import log_custody_event

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    tools_used: List[str]
    status: str = "success"


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    request: Request,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Forensic AI Investigation Assistant (Read-Only).
    Answers natural language queries against real PostgreSQL & Blockchain data with RBAC.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message prompt cannot be empty.")

    try:
        result = ai_investigator.process_investigation_query(
            message=payload.message,
            db=db,
            user=current_user
        )

        return {
            "reply": result["reply"],
            "tools_used": result.get("tools_used", []),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Investigation Engine encountered an error: {str(e)}"
        )
