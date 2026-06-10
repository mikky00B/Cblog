from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from time import time

from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth")
login_attempts: dict[str, list[float]] = {}
MAX_ATTEMPTS = 8
WINDOW_SECONDS = 15 * 60


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = payload.email.lower().strip()
    now = time()
    attempts = [attempt for attempt in login_attempts.get(email, []) if now - attempt < WINDOW_SECONDS]
    if len(attempts) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many login attempts")

    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        attempts.append(now)
        login_attempts[email] = attempts
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    login_attempts.pop(email, None)
    return TokenResponse(access_token=create_access_token(user.id))
