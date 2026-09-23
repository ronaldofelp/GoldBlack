import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# A URL do banco vem de variável de ambiente (DIP na prática): em dev fica no
# SQLite local; em produção basta exportar DATABASE_URL apontando pro Oracle
# Autonomous DB (ex.: "oracle+oracledb://ADMIN:senha@goldblackdb_tp") — nenhum
# outro código muda. Ver infra/oracle_spike.py (caminho de conexão validado).
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./goldblack_coffee.db")


def _build_connect_args(url: str) -> dict:
    """Monta os connect_args conforme o banco alvo.

    - SQLite: check_same_thread=False (necessário pras threads do uvicorn/TestClient).
    - Oracle Autonomous DB: injeta a wallet (mTLS) e o diretório do tnsnames a partir
      de variáveis de ambiente — nenhum segredo nem caminho fica hardcoded. O driver
      oracledb roda em thin mode (Python puro, sem Oracle Client), o MESMO caminho já
      validado no infra/oracle_spike.py. Exporte em produção:
          DATABASE_URL=oracle+oracledb://ADMIN:<senha>@goldblackdb_tp
          ORACLE_WALLET_DIR=/app/wallet          (ou TNS_ADMIN)
          ORACLE_WALLET_PASSWORD=<senha-da-wallet>
    """
    if url.startswith("sqlite"):
        return {"check_same_thread": False}

    if url.startswith("oracle"):
        args: dict = {}
        wallet_dir = os.environ.get("ORACLE_WALLET_DIR") or os.environ.get("TNS_ADMIN")
        wallet_pw = os.environ.get("ORACLE_WALLET_PASSWORD")
        if wallet_dir:
            args["config_dir"] = wallet_dir       # onde está o tnsnames.ora
            args["wallet_location"] = wallet_dir  # onde está o ewallet.pem (mTLS)
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
