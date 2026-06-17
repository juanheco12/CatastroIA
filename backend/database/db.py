from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

# Render/Heroku-style URLs use the legacy "postgres://" scheme, which
# SQLAlchemy 1.4+/2.x no longer recognizes — normalize it.
_database_url = settings.database_url
if _database_url.startswith("postgres://"):
    _database_url = _database_url.replace("postgres://", "postgresql://", 1)

_is_sqlite = _database_url.startswith("sqlite")

engine = create_engine(
    _database_url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
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
    Base.metadata.create_all(bind=engine)
