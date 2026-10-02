import os
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client

from suggestions import build_suggestions

load_dotenv()

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app = FastAPI(title="User Guidance API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    education: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    interests: str = Field(min_length=1, max_length=500)


def current_user(authorization: str = Header(None)):
    """Verify the Supabase access token sent by the frontend."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing token")
    try:
        res = sb.auth.get_user(authorization.split(" ", 1)[1])
        if not res or not res.user:
            raise ValueError
        return res.user
    except Exception:
        raise HTTPException(401, "Invalid or expired token")


def fetch_profile(user_id: str):
    rows = sb.table("profiles").select("*").eq("user_id", user_id).limit(1).execute().data
    return rows[0] if rows else None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/profile")
def get_profile(user=Depends(current_user)):
    return {"profile": fetch_profile(user.id)}


@app.put("/api/profile")
def save_profile(body: ProfileIn, user=Depends(current_user)):
    row = {"user_id": user.id, **body.model_dump()}
    sb.table("profiles").upsert(row).execute()
    return {"profile": fetch_profile(user.id)}


@app.get("/api/suggestions")
def suggestions(user=Depends(current_user)):
    profile = fetch_profile(user.id)
    if not profile:
        raise HTTPException(404, "Complete your profile first")
    return build_suggestions(profile)
