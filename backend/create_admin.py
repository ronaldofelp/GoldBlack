# -*- coding: utf-8 -*-
"""
create_admin.py — Cria o primeiro usuário ADMIN num banco de produção vazio.

Necessário porque o seed automático (mock_data) só roda em dev/test: em produção
o banco sobe sem nenhum usuário, e este script é a porta de entrada segura.

Uso (na VM, com as mesmas variáveis de ambiente do backend):
    cd backend
    python create_admin.py

As credenciais podem vir de variáveis de ambiente (não-interativo) ou serão
pedidas via prompt (a senha nunca ecoa):
    ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD

Conexão: usa exatamente a mesma DATABASE_URL / connect_args do app
(app.database), então funciona tanto em SQLite quanto no Oracle com wallet.
"""
import getpass
import os
import sys
import uuid

# Garante saída UTF-8 mesmo em consoles legados (ex.: cp1252 no Windows),
# evitando UnicodeEncodeError ao imprimir texto acentuado (ç, ã, é...).
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

# Garante que o pacote app seja importável rodando de dentro de backend/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal  # noqa: E402
from app import models  # noqa: E402
from passlib.context import CryptContext  # noqa: E402

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prompt(env_name: str, label: str, secret: bool = False) -> str:
    val = os.environ.get(env_name)
    if val:
        return val
    return getpass.getpass(label) if secret else input(label)


def main() -> None:
    name = _prompt("ADMIN_NAME", "Nome do admin: ").strip()
    email = _prompt("ADMIN_EMAIL", "E-mail do admin: ").strip().lower()
    password = _prompt("ADMIN_PASSWORD", "Senha do admin: ", secret=True)

    if not name or not email or not password:
        print("!! Nome, e-mail e senha são obrigatórios.")
        sys.exit(1)
    if len(password) < 8:
        print("!! Senha muito curta: use ao menos 8 caracteres.")
        sys.exit(1)

    db = SessionLocal()
    try:
        if db.query(models.User).filter(models.User.email == email).first():
            print(f"!! Já existe usuário com o e-mail {email}.")
            sys.exit(1)

        admin = models.User(
            id=str(uuid.uuid4()),
            name=name,
            email=email,
            password_hash=pwd_context.hash(password),
            role=models.UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        print(f"[OK] Admin criado: {name} <{email}>")
    finally:
        db.close()


if __name__ == "__main__":
    main()
