# -*- coding: utf-8 -*-
r"""
oracle_cleanup.py — Dropa APENAS as tabelas do GoldBlack no schema ADMIN do ADB.
Útil quando o alembic upgrade falha no meio (DDL não-transacional no Oracle)
e precisa recomeçar do zero.

Uso:
    cd infra
    .venv-spike\Scripts\python.exe oracle_cleanup.py

As credenciais são lidas das mesmas variáveis de ambiente usadas no alembic:
    ORACLE_DB_USER, ORACLE_DB_PASSWORD, ORACLE_DB_DSN,
    ORACLE_WALLET_DIR (ou TNS_ADMIN), ORACLE_WALLET_PASSWORD
"""
import getpass
import os
import sys

# Garante saída UTF-8 mesmo em consoles legados (ex.: cp1252 no Windows),
# evitando UnicodeEncodeError ao imprimir texto acentuado (ç, ã, é...).
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

WALLET_DIR = os.environ.get("ORACLE_WALLET_DIR") or os.environ.get("TNS_ADMIN") or \
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "wallet")

DSN      = os.environ.get("ORACLE_DB_DSN", "goldblackdb_tp")
DB_USER  = os.environ.get("ORACLE_DB_USER", "ADMIN")

# Tabelas na ordem correta para respeitar FK (filhas antes das mães).
TABLES = [
    # filhas — sem dependentes
    "tracking_events",
    "machine_usages",
    "labor_entries",
    "activity_supplies",
    "washer_phases",
    "silo_phases",
    "sales",
    "processing_phases",
    "patio_phases",
    "dryer_phases",
    "coffee_trackings",
    "agricultural_activities",
    "traceability_batches",
    "technical_recommendations",
    "system_alerts",
    "soil_analyses",
    "productions",
    "plot_varieties",
    "harvest_estimates",
    "workers",
    "weather_logs",
    "service_definitions",
    "plots",
    "machines",
    "financial_transactions",
    "farms",
    "users",
    "seasons",
    "agricultural_supplies",
    # tabela interna do alembic (limpa o stamp de versão também)
    "alembic_version",
]


def _get(env_name: str, prompt: str) -> str:
    val = os.environ.get(env_name)
    if not val:
        val = getpass.getpass(prompt)
    return val


def main():
    try:
        import oracledb
    except ImportError:
        print("!! Falta oracledb. Rode: pip install oracledb")
        sys.exit(1)

    db_password  = _get("ORACLE_DB_PASSWORD",     "Senha do ADMIN do ADB: ")
    wallet_pw    = _get("ORACLE_WALLET_PASSWORD",  "Senha da wallet: ")

    connect_args = dict(
        user=DB_USER,
        password=db_password,
        dsn=DSN,
        config_dir=WALLET_DIR,
        wallet_location=WALLET_DIR,
        wallet_password=wallet_pw,
    )

    print(f"Conectando a {DSN} como {DB_USER}...")
    with oracledb.connect(**connect_args) as conn:
        cur = conn.cursor()

        # Busca quais dessas tabelas existem de fato no schema
        cur.execute("SELECT table_name FROM user_tables")
        existing = {row[0].upper() for row in cur.fetchall()}

        dropped, skipped = [], []
        for tbl in TABLES:
            if tbl.upper() in existing:
                try:
                    cur.execute(f"DROP TABLE {tbl} CASCADE CONSTRAINTS PURGE")
                    dropped.append(tbl)
                    print(f"  [OK]   DROP TABLE {tbl}")
                except Exception as e:
                    print(f"  [FALHA] {tbl}: {e}")
            else:
                skipped.append(tbl)

        conn.commit()

    print(f"\nDropadas: {len(dropped)} tabelas")
    if skipped:
        print(f"Não existiam (ok): {', '.join(skipped)}")
    print("\nSchema limpo. Pode rodar: python -m alembic upgrade head")


if __name__ == "__main__":
    main()
