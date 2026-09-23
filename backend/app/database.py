import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# A URL do banco vem de variável de ambiente (DIP na prática): em dev fica no
# SQLite local; em produção basta exportar DATABASE_URL apontando pro Oracle
# Autonomous DB (ex.: "oracle+oracledb://ADMIN:senha@goldblackdb_tp") — nenhum
# outro código muda. Ver infra/oracle_spike.py (caminho de conexão validado).
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./goldblack_coffee.db")

# check_same_thread só existe no SQLite; passar isso pro Oracle quebraria.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    echo=False,
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
