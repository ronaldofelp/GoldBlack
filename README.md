# GoldBlack Coffee Platform

Plataforma completa de rastreabilidade e gestão agrícola do café, composta por uma **API RESTful** (FastAPI + SQLAlchemy) e um **frontend web** (React + Vite + TypeScript).

---

##  Arquitetura

```
Ch/
├── docker-compose.yml        # Orquestra front + back com um único comando
├── backend/
│   ├── app/
│   │   ├── database.py       # Engine SQLite/Oracle + get_db
│   │   ├── models.py         # SQLAlchemy ORM (20 tabelas)
│   │   ├── schemas.py        # Pydantic v2 (validação entrada/saída)
│   │   ├── repositories.py   # Interfaces ABC + implementações SQLAlchemy
│   │   ├── dependencies.py   # FastAPI Depends — ponto de wiring único (DIP)
│   │   └── main.py           # Routers + endpoints
│   ├── mock_data.py          # Seed de dados de exemplo
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── src/
    ├── Dockerfile            # Multi-stage: Node build → nginx serve
    └── nginx.conf
```

### Princípio aplicado: DIP (Dependency Inversion Principle)

```
Endpoints → IRepository (interface)
               ↑ Depends()
         dependencies.py
               ↓
    SQLAlchemyXRepository (implementação)
```

Os endpoints **nunca** importam SQLAlchemy diretamente. Para migrar para Oracle, basta:
1. Alterar `DATABASE_URL` em `database.py`
2. Trocar as implementações em `dependencies.py`

---

## Execução via Docker (recomendado)

> **Pré-requisito**: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.

```bash

docker compose up --build
```

Aguarde o build e o healthcheck. Quando estiver pronto:

| Serviço | URL |
|---|---|
|  Frontend | http://localhost:3000 |
|  API Backend | http://localhost:8000 |
|  Swagger UI | http://localhost:8000/docs |
|  ReDoc | http://localhost:8000/redoc |

### Comandos úteis

```bash

docker compose up --build -d


docker compose logs -f


docker compose down


docker compose down -v


docker compose up --build backend
```

> **Nota**: o banco SQLite persiste no volume Docker `db_data`. Os dados de exemplo são gerados automaticamente na primeira inicialização.

---

## Execução local (sem Docker)

### Backend

```bash
cd backend


python -m venv .venv
.venv\Scripts\activate          
 source .venv/bin/activate     


pip install -r requirements.txt


uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend


npm install


npm run dev
```

> **Nota**: o Vite sobe por padrão na porta **5173** (ou outra porta disponível). A URL exata é exibida no terminal após o comando `npm run dev`. Caso queira acessar via domínio fixo, utilize a execução via Docker (porta 3000).

---

##  Testes

### Backend

```bash
cd backend
.venv\Scripts\python.exe -m pytest tests/ -v   
 python -m pytest tests/ -v                   
```

### Frontend

```bash
cd frontend
npm run test
```

---

##  Endpoints disponíveis

| Domínio               | Prefixo                    | Métodos          |
|-----------------------|----------------------------|------------------|
| Usuários              | `/users`                   | GET, POST, PATCH, DELETE |
| Propriedades          | `/farms`                   | GET, POST, PATCH, DELETE |
| Talhões               | `/plots`                   | GET, POST, PATCH, DELETE |
| Análises de Solo      | `/soil-analyses`           | GET, POST, PATCH, DELETE |
| Recomendações Técnicas| `/recommendations`         | GET, POST, PATCH, DELETE |
| Estimativas de Safra  | `/harvest-estimates`       | GET, POST, PATCH, DELETE |
| Registros Climáticos  | `/weather-logs`            | GET, POST, PATCH, DELETE |
| Alertas do Sistema    | `/alerts`                  | GET, POST, PATCH, DELETE |
| Insumos Agrícolas     | `/supplies`                | GET, POST, PATCH, DELETE |
| Atividades Agrícolas  | `/activities`              | GET, POST, PATCH, DELETE |
| Lotes Rastreabilidade | `/batches`                 | GET, POST, PATCH, DELETE |
| Fase Lavador          | `/batches/{id}/phases/washer`     | GET, POST, DELETE |
| Fase Terreiro         | `/batches/{id}/phases/patio`      | GET, POST, PATCH, DELETE |
| Fase Secador          | `/batches/{id}/phases/dryer`      | GET, POST, PATCH, DELETE |
| Fase Tulha/Silo       | `/batches/{id}/phases/silo`       | GET, POST, PATCH, DELETE |
| Beneficiamento        | `/batches/{id}/phases/processing` | GET, POST, PATCH, DELETE |
| Comercialização       | `/sales`                   | GET, POST, PATCH, DELETE |
| Financeiro            | `/transactions`            | GET, POST, PATCH, DELETE |
| Health Check          | `/health`                  | GET |

---

##  Migração para Oracle

```python

DATABASE_URL = "oracle+oracledb://user:senha@host:1521/?service_name=ORCL"

# Remova também o argumento connect_args (exclusivo do SQLite):
engine = create_engine(DATABASE_URL)
```

Em `dependencies.py`, substitua `SQLAlchemyXRepository` por `OracleXRepository` quando implementado.

---

## 🗄️ Banco de dados

O arquivo `goldblack_coffee.db` (SQLite) é criado automaticamente ao iniciar a aplicação. Os dados de exemplo são populados automaticamente se o banco estiver vazio.

---

##  Dependências principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| fastapi | 0.115 | Framework web |
| uvicorn | 0.30 | Servidor ASGI |
| sqlalchemy | 2.0 | ORM |
| pydantic | 2.9 | Validação de dados |
| passlib[bcrypt] | 1.7 | Hash de senhas |
| react | 19 | UI framework |
| vite | 5 | Bundler frontend |
