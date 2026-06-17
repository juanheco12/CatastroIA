from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

# Render/Heroku-style URLs use the legacy "postgres://" scheme, which
# SQLAlchemy 1.4+/2.x no longer recognizes — normalize it.
_database_url = settings.database_url
if _database_url.startswith("postgres://"):
    _database_url = _database_url.replace("postgres://", "postgresql://", 1)

_is_sqlite = _database_url.startswith("sqlite")
IS_SQLITE = _is_sqlite

# pool_pre_ping evita el error "SSL connection has been closed unexpectedly":
# Neon cierra conexiones inactivas y, sin esto, SQLAlchemy intenta reusar una
# conexión muerta del pool en vez de detectarla y reconectar.
engine = create_engine(
    _database_url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=True,
    **({} if _is_sqlite else {"pool_recycle": 280}),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import models.motivada  # noqa: F401 — registers models with Base
    import models.soporte   # noqa: F401 — registers models with Base
    import models.template  # noqa: F401 — registers models with Base

    # soporte_chunks usa el tipo `vector` (extensión pgvector) para la
    # busqueda semantica del Asistente. Se crea aparte y de forma tolerante a
    # fallos para que, si pgvector no estuviera disponible, el resto de la
    # app (motivadas, historial, soportes sin RAG) siga funcionando.
    tablas_principales = [
        t for name, t in Base.metadata.tables.items() if name != "soporte_chunks"
    ]
    Base.metadata.create_all(bind=engine, tables=tablas_principales)

    if _is_sqlite:
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables["soporte_chunks"]])
    except Exception:
        pass
