from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.db import init_db, get_db
from routes import motivada_routes, template_routes, history_routes, chat_routes, soporte_routes, biblioteca_routes
from config import settings


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
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(motivada_routes.router)
app.include_router(template_routes.router)
app.include_router(history_routes.router)
app.include_router(chat_routes.router)
app.include_router(soporte_routes.router)
app.include_router(biblioteca_routes.router)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Hace una consulta real para que el ping de keep-alive también evite que
    # el cómputo de Neon (Postgres) entre en autosuspend de forma
    # independiente al spin-down de Render — si solo se hace ping aquí sin
    # tocar la base, la base puede seguir durmiéndose entre pings.
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    return {"status": "ok", "servicio": "CatIA API v1.0.0", "db": db_status}