# GoldBlack Coffee Platform

ERP de gestão e rastreabilidade para produtores de café — **em produção** em https://goldblackcoffee.duckdns.org.

Conecta o que acontece na lavoura com quanto custou por saca e prova a procedência do café via QR Code.

**Stack:** React 19 + FastAPI + Oracle Autonomous Database 19c · **Infra:** OCI (VM + ADB + OCIR) · **CI/CD:** GitHub Actions

---

## Funcionalidades principais

| Domínio | O que faz |
|---------|-----------|
| **Gestão agrícola** | Propriedades, talhões, atividades, solo, clima, estimativas de safra |
| **Motor de custo** | Insumos + mão de obra + hora-máquina por atividade → **custo/ha e custo/saca** por talhão × safra |
| **Rastreabilidade QR** | Lote `GB-AAAA-XXXX`, 9 etapas (colheita → finalizado), página pública sem login para o consumidor |
| **Financeiro / Estoque / Vendas** | Transações, fluxo de caixa, controle de insumos |
| **Usuários e acesso** | JWT (HS256 · 12h), papéis ADMIN / OPERATOR, RBAC nos endpoints |

---

## Arquitetura

```
GoldBlack/
├── .github/workflows/ci.yml   # CI/CD: pytest (gate) → build/push OCIR → deploy VM
├── docker-compose.yml         # Orquestra Caddy + backend + frontend
├── backend/
│   ├── app/
│   │   ├── main.py            # Auth + routers + guarda global JWT
│   │   ├── cost_router.py     # Endpoints do motor de custo
│   │   ├── services/
│   │   │   └── costing.py     # Cálculo custo/ha e custo/saca (Decimal, selectinload)
│   │   ├── models.py          # SQLAlchemy ORM — 29 tabelas
│   │   ├── schemas.py         # Pydantic v2
│   │   ├── repositories.py    # Repository pattern (DIP) — interfaces ABC + implementações
│   │   ├── dependencies.py    # FastAPI Depends — ponto de wiring único
│   │   └── database.py        # Engine Oracle (prod) / SQLite (dev/test)
│   ├── alembic/               # Migrações de schema (baseline 29 tabelas + índices)
│   ├── tests/                 # 30 testes pytest — SQLite em memória, sem Oracle
│   ├── create_admin.py        # Bootstrap do 1º ADMIN em produção
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── pages/             # Lavouras, Custo, Rastreio, Financeiro, Usuários…
    │   ├── services/api.ts    # Ponto único de acesso à API (axios)
    │   └── types/index.ts     # Tipos TypeScript compartilhados
    ├── Dockerfile             # Multi-stage: Node (build Vite) → nginx (servir estático)
    └── nginx.conf
```

### Princípio aplicado: DIP (Dependency Inversion Principle)

```
Endpoints → IRepository (interface ABC)
                ↑ Depends()
          dependencies.py
                ↓
   SQLAlchemyXRepository (implementação)
```

Os endpoints nunca importam SQLAlchemy diretamente. Foi esse desacoplamento que permitiu migrar de SQLite para Oracle sem tocar na regra de negócio.

---

## Desenvolvimento local

### Pré-requisitos

- Python 3.12+ e Node.js 20+
- Docker ou Podman (opcional, para rodar tudo junto)

### Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate        # Linux/Mac/Git Bash
# .venv\Scripts\activate         # Windows cmd

pip install -r requirements.txt

# Sobe com SQLite em memória (sem Oracle, sem wallet)
APP_ENV=development uvicorn app.main:app --reload
```

> Em `APP_ENV=development` o schema é criado automaticamente via `create_all` e um seed de demonstração é populado. Em produção, o schema é gerenciado exclusivamente pelo Alembic.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite sobe na porta **5173** por padrão. O proxy `/api → http://localhost:8000` já está configurado em `vite.config.ts`.

### Com Docker Compose (dev)

```bash
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend / Swagger | http://localhost:8000/docs |

---

## Testes

```bash
cd backend
python -m pytest tests/ -v
```

30 testes de integração rodando em **SQLite em memória** — sem Oracle, sem wallet, sem variáveis de ambiente extras. São o gate do pipeline de CI: nenhum deploy acontece se um teste falhar.

---

## CI/CD

Push na `main` → **GitHub Actions** (`.github/workflows/ci.yml`):

1. **Job `test`** — pytest no runner (SQLite, sem segredos). Gate obrigatório.
2. **Job `deploy`** (só após test OK, só em `push`, nunca em PR):
   - Build das imagens no runner (fora da VM — evita OOM).
   - Push para OCIR (`vcp.ocir.io/ax52rtggbppy`).
   - SSH na VM → `docker compose pull` + `up -d --force-recreate`.

Todas as actions são pinadas por SHA de commit (hardening de supply chain).

---

## Produção

| Item | Valor |
|------|-------|
| URL | https://goldblackcoffee.duckdns.org |
| VM | OCI VM.Standard.E5.Flex · 1 OCPU / 8 GB · Ubuntu 22.04 · sa-vinhedo-1 |
| Banco | Oracle Autonomous Database 19c (Always Free) · mTLS/wallet |
| Proxy | Caddy 2 · HTTPS automático (Let's Encrypt) · HSTS · HTTP/3 |
| Imagens | OCIR `vcp.ocir.io/ax52rtggbppy/goldblack-{backend,frontend}:latest` |

### Operações de schema (quando há mudança de modelo)

```bash
# Na VM, após o deploy:
alembic upgrade head
python create_admin.py   # somente no primeiro deploy
```

---

## Variáveis de ambiente (produção)

Configuradas em `.env.prod` na VM (fora do repositório). Nunca commitar segredos.

| Variável | Descrição |
|----------|-----------|
| `APP_ENV` | `production` |
| `JWT_SECRET_KEY` | Chave forte (≥ 32 chars). App recusa subir sem ela em prod. |
| `ORACLE_DB_USER / PASSWORD / DSN` | Credenciais do ADB |
| `ORACLE_WALLET_DIR / PASSWORD` | Caminho absoluto da wallet + senha |

---

## Dependências principais

| Pacote | Uso |
|--------|-----|
| `fastapi 0.115` | Framework web |
| `uvicorn` | Servidor ASGI |
| `sqlalchemy 2.0` | ORM |
| `python-oracledb` | Driver Oracle (thin mode — sem Oracle Client) |
| `alembic` | Migrações de schema |
| `python-jose[cryptography]` | JWT (HS256) |
| `passlib[bcrypt]` | Hash de senhas |
| `pydantic 2.9` | Validação de dados |
| `react 19` + `vite 5` | Frontend SPA |
| `tailwindcss` | Estilização |
