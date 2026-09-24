import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Toda a API (menos rotas públicas do QR) exige Bearer token. Autentica o
# client de teste como o admin semeado para exercitar os endpoints protegidos.
_login = client.post("/auth/login", json={"email": "joao@goldblack.com.br", "password": "senha123"})
assert _login.status_code == 200, f"Login de teste falhou: {_login.text}"
client.headers.update({"Authorization": f"Bearer {_login.json()['access_token']}"})

state = {
    "farm_id": None,
    "plot_id": None,
    "batch_id": None,
}


def test_list_farms():
    response = client.get("/farms")
    assert response.status_code == 200
    farms = response.json()
    assert isinstance(farms, list)
    assert len(farms) > 0, "Nenhuma propriedade encontrada (seed não rodou?)"
    state["farm_id"] = farms[0]["id"]


def test_create_plot():
    assert state["farm_id"], "farm_id não disponível"
    payload = {
        "farm_id": state["farm_id"],
        "code": "T-PYTEST",
        "area_ha": 5.5,
        "variety": "Bourbon Amarelo",
        "planting_year": 2024,
        "status": "IN_PRODUCTION",
    }
    response = client.post("/plots", json=payload)
    if response.status_code != 201:
        print("PLOT ERROR:", response.json())
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == "T-PYTEST"
    assert "id" in data
    state["plot_id"] = data["id"]


def test_list_plots():
    response = client.get("/plots")
    assert response.status_code == 200
    plots = response.json()
    assert any(p["id"] == state["plot_id"] for p in plots)


def test_get_plot():
    response = client.get(f"/plots/{state['plot_id']}")
    assert response.status_code == 200
    assert response.json()["id"] == state["plot_id"]


def test_update_plot():
    payload = {"status": "RENOVATION"}
    response = client.patch(f"/plots/{state['plot_id']}", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "RENOVATION"


def test_create_batch():
    assert state["plot_id"], "plot_id não disponível"
    payload = {
        "plot_id": state["plot_id"],
        "batch_code": "LOTE-PYTEST-01",
        "harvest_season": "2025/2026",
        "harvest_date": "2026-08-26",
        "coffee_type": "PULPED_NATURAL",
        "total_volume_measures": 250,
    }
    response = client.post("/batches", json=payload)
    if response.status_code != 201:
        print("BATCH ERROR:", response.json())
    assert response.status_code == 201
    data = response.json()
    assert data["batch_code"] == "LOTE-PYTEST-01"
    assert "id" in data
    state["batch_id"] = data["id"]


def test_list_batches():
    response = client.get("/batches")
    assert response.status_code == 200
    batches = response.json()
    assert any(b["id"] == state["batch_id"] for b in batches)


def test_get_batch():
    response = client.get(f"/batches/{state['batch_id']}")
    assert response.status_code == 200
    assert response.json()["id"] == state["batch_id"]


def test_update_batch():
    payload = {"coffee_type": "NATURAL"}
    response = client.patch(f"/batches/{state['batch_id']}", json=payload)
    assert response.status_code == 200
    assert response.json()["coffee_type"] == "NATURAL"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_delete_batch():
    response = client.delete(f"/batches/{state['batch_id']}")
    assert response.status_code == 204


def test_delete_plot():
    response = client.delete(f"/plots/{state['plot_id']}")
    assert response.status_code == 204
