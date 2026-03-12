import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import debates, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create data directory on startup."""
    os.makedirs(settings.data_dir, exist_ok=True)
    yield


app = FastAPI(title="Cobblers - Multi-LLM Debate Tool", version="0.1.0", lifespan=lifespan)

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(debates.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
