import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Dialeto do banco vem de DATABASE_URL.
# SQLite (dev): sqlite:///./goldblack_coffee.db
# Oracle (prod): oracle+oracledb://  ← sem credenciais na URL para evitar
#   que caracteres especiais (@ # % +) na senha quebrem o parser de URL.
#   Credenciais e wallet vão inteiramente via connect_args, igual ao padrão
#   do infra/oracle_spike.py. Exporte em produção:
#       DATABASE_URL=oracle+oracledb://
#       ORACLE_DB_USER=ADMIN
#       ORACLE_DB_PASSWORD=<senha-do-ADB>    ← pode ter @ # % sem problema
#       ORACLE_DB_DSN=goldblackdb_tp
#       ORACLE_WALLET_DIR=/app/wallet        (ou TNS_ADMIN)
#       ORACLE_WALLET_PASSWORD=<senha-da-wallet>
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./goldblack_coffee.db")


def _build_connect_args(url: str) -> dict:
    """Monta os connect_args conforme o banco alvo.

    - SQLite: check_same_thread=False (necessário pras threads do uvicorn/TestClient).
    - Oracle Autonomous DB: todas as credenciais e wallet passam via connect_args
      (não na URL) para que caracteres especiais na senha não quebrem o parser.
      Mesmo padrão thin-mode já validado em infra/oracle_spike.py.
    """
    if url.startswith("sqlite"):
        return {"check_same_thread": False}

    if url.startswith("oracle"):
        args: dict = {}

        # Credenciais — nunca embutidas na URL.
        db_user = os.environ.get("ORACLE_DB_USER", "ADMIN")
        db_password = os.environ.get("ORACLE_DB_PASSWORD")
        db_dsn = os.environ.get("ORACLE_DB_DSN", "goldblackdb_tp")
        if db_user:
            args["user"] = db_user
        if db_password:
            args["password"] = db_password
        if db_dsn:
            args["dsn"] = db_dsn

        # Wallet mTLS.
        wallet_dir = os.environ.get("ORACLE_WALLET_DIR") or os.environ.get("TNS_ADMIN")
        wallet_pw = os.environ.get("ORACLE_WALLET_PASSWORD")
        if wallet_dir:
            args["config_dir"] = wallet_dir       # onde está o tnsnames.ora
            args["wallet_location"] = wallet_dir  # onde está o ewallet.pem
        if wallet_pw:
            args["wallet_password"] = wallet_pw

        return args

    return {}


_connect_args = _build_connect_args(DATABASE_URL)

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
