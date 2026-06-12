from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database.db import init_db
from routes import motivada_routes, template_routes, history_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CatIA API",
    description="Generador de motivadas para trámites catastrales colombianos",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(motivada_routes.router)
app.include_router(template_routes.router)
app.include_router(history_routes.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "servicio": "CatIA API v1.0.0"}
