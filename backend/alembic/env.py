"""
Alembic environment do GoldBlack Coffee.

Configurado para:
  - usar o metadata do app (app.database.Base) → autogenerate enxerga os models;
  - ler a URL do banco de DATABASE_URL (mesma var que a app usa) → as migrações
    rodam tanto no SQLite (dev) quanto no Oracle Autonomous DB (prod);
  - render_as_batch=True → o SQLite não suporta ALTER TABLE completo; o batch mode
    recria a tabela por baixo dos panos para aplicar ALTERs.
"""
import os
from logging.config import fileConfig

from alembic import context

# Garante que "app" seja importável quando o alembic roda a partir de backend/.
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, DATABASE_URL, engine
from app import models  # noqa: F401 — registra todos os models no metadata

config = context.config

# URL vem do ambiente (não fica hardcoded no alembic.ini).
config.set_main_option("sqlalchemy.url", DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# batch mode é uma gambiarra do SQLite (que não tem ALTER TABLE completo); no
# Oracle ele é desnecessário e recria tabelas à toa, então liga só no SQLite.
_render_as_batch = DATABASE_URL.startswith("sqlite")


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=_render_as_batch,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Reusa o engine do app (mesma URL + connect_args da wallet Oracle), pra que a
    # migração fale com o ADB pelo MESMO caminho mTLS que a aplicação em produção.
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=_render_as_batch,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
