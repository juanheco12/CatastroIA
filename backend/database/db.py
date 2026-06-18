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


def _tiene_columna_vector(tabla) -> bool:
    from pgvector.sqlalchemy import Vector
    return any(isinstance(c.type, Vector) for c in tabla.columns)


def init_db():
    import models.motivada     # noqa: F401 — registers models with Base
    import models.soporte      # noqa: F401 — registers models with Base
    import models.template     # noqa: F401 — registers models with Base
    import models.biblioteca   # noqa: F401 — registers models with Base

    # Las tablas con columna `vector` (extensión pgvector) se crean aparte y
    # de forma tolerante a fallos para que, si pgvector no estuviera
    # disponible (p. ej. SQLite local), el resto de la app siga funcionando.
    tablas_vector = [t for t in Base.metadata.tables.values() if _tiene_columna_vector(t)]
    tablas_principales = [t for t in Base.metadata.tables.values() if t not in tablas_vector]
    Base.metadata.create_all(bind=engine, tables=tablas_principales)

    # La extension solo existe en Postgres. Bajo SQLite se omite ese paso,
    # pero las tablas con columna vector se siguen creando igual: en SQLite
    # la columna queda con afinidad generica (acepta NULL/texto sin la
    # extension) y varias de estas tablas (p. ej. plantillas_motivada) son
    # el almacen principal de su funcionalidad, no solo un indice auxiliar.
    if not _is_sqlite:
        try:
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception:
            pass
    try:
        Base.metadata.create_all(bind=engine, tables=tablas_vector)
    except Exception:
        pass
