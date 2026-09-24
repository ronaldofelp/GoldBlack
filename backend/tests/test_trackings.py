import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# CRUD de rastreio é protegido (só o consumo público via QR é aberto). Autentica
# o client de teste como o admin semeado.
_login = client.post("/auth/login", json={"email": "joao@goldblack.com.br", "password": "senha123"})
assert _login.status_code == 200, f"Login de teste falhou: {_login.text}"
client.headers.update({"Authorization": f"Bearer {_login.json()['access_token']}"})
ADMIN_NAME = _login.json()["user"]["name"]

# Client SEM autenticação: simula quem escaneia o QR (rota pública de eventos).
anon = TestClient(app)

state = {
    "farm_id": None,
    "plot_id": None,
    "batch_id": None,
    "tracking_id": None,
    "tracking_code": None,
}

def setup_module(module):
    # Setup necessary entities
    # Farm
    farms = client.get("/farms").json()
    if not farms:
        payload = {"name": "Test Farm", "total_area_ha": 100, "city": "City", "state": "ST"}
        res = client.post("/farms", json=payload)
        state["farm_id"] = res.json()["id"]
    else:
        state["farm_id"] = farms[0]["id"]
        
    # Plot
    res = client.post("/plots", json={
        "farm_id": state["farm_id"],
        "code": "TEST-PLOT-TRK",
        "area_ha": 1.0,
        "variety": "Bourbon",
        "planting_year": 2020,
        "status": "IN_PRODUCTION"
    })
    state["plot_id"] = res.json()["id"]
    
    # Batch
    res = client.post("/batches", json={
        "plot_id": state["plot_id"],
        "batch_code": "BATCH-TRK-01",
        "harvest_season": "2026/2027",
        "harvest_date": "2026-09-01",
        "coffee_type": "NATURAL",
        "total_volume_measures": 100
    })
    state["batch_id"] = res.json()["id"]

def teardown_module(module):
    # Cleanup
    if state["batch_id"]:
        client.delete(f"/batches/{state['batch_id']}")
    if state["plot_id"]:
        client.delete(f"/plots/{state['plot_id']}")


def test_create_tracking():
    payload = {
        "batch_id": state["batch_id"],
        "description": "Café Especial Lote TRK"
    }
    response = client.post("/trackings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "tracking_code" in data
    assert data["description"] == "Café Especial Lote TRK"
    assert data["current_stage"] == "COLHEITA"
    assert data["status"] == "IN_PROGRESS"
    
    # Check if initial event was created
    assert "events" in data
    assert len(data["events"]) == 1
    assert data["events"][0]["stage"] == "COLHEITA"
    
    state["tracking_id"] = data["id"]
    state["tracking_code"] = data["tracking_code"]


def test_get_tracking():
    response = client.get(f"/trackings/{state['tracking_id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == state["tracking_id"]
    assert data["tracking_code"] == state["tracking_code"]


def test_get_tracking_by_code():
    response = client.get(f"/trackings/code/{state['tracking_code']}")
    assert response.status_code == 200
    assert response.json()["id"] == state["tracking_id"]


def test_list_trackings():
    response = client.get("/trackings")
    assert response.status_code == 200
    data = response.json()
    assert any(t["id"] == state["tracking_id"] for t in data)


def test_list_trackings_by_status():
    response = client.get("/trackings?status=IN_PROGRESS")
    assert response.status_code == 200
    data = response.json()
    assert any(t["id"] == state["tracking_id"] for t in data)


def test_update_tracking():
    response = client.patch(f"/trackings/{state['tracking_id']}", json={"description": "Atualizado"})
    assert response.status_code == 200
    assert response.json()["description"] == "Atualizado"


def _fresh_tracking_id(code_suffix: str) -> str:
    """Cria um lote + rastreio isolados (via client autenticado) para testes que
    não devem perturbar a sequência de estado compartilhada."""
    batch = client.post("/batches", json={
        "plot_id": state["plot_id"],
        "batch_code": f"BATCH-ANON-{code_suffix}",
        "harvest_season": "2026/2027",
        "harvest_date": "2026-09-01",
        "coffee_type": "NATURAL",
        "total_volume_measures": 100,
    }).json()
    return client.post("/trackings", json={
        "batch_id": batch["id"], "description": f"Rastreio anon {code_suffix}",
    }).json()["id"]


def test_anon_event_gets_neutral_author():
    """Chamador não autenticado (QR): recorded_by é rotulado, nunca confiado do payload."""
    tid = _fresh_tracking_id("author")
    payload = {"stage": "LAVADOR", "notes": "Espalhado no terreiro", "recorded_by": "Administrador"}
    response = anon.post(f"/trackings/{tid}/events", json=payload)
    assert response.status_code == 201
    assert response.json()["recorded_by"] == "Consumidor via QR"


def test_anon_cannot_finalize():
    """Só usuário autenticado finaliza um rastreio; anônimo recebe 403."""
    tid = _fresh_tracking_id("finalize")
    response = anon.post(f"/trackings/{tid}/events", json={"stage": "FINALIZADO"})
    assert response.status_code == 403


def test_add_tracking_event():
    payload = {
        "stage": "LAVADOR",
        "notes": "Café lavado com sucesso",
        "recorded_by": "Ronaldo"  # deve ser IGNORADO (anti-falsificação de autoria)
    }
    response = client.post(f"/trackings/{state['tracking_id']}/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["stage"] == "LAVADOR"
    assert data["notes"] == "Café lavado com sucesso"
    # recorded_by vem do principal autenticado, não do payload:
    assert data["recorded_by"] == ADMIN_NAME
    assert data["recorded_by"] != "Ronaldo"

    # Verify tracking current_stage was updated
    tracking = client.get(f"/trackings/{state['tracking_id']}").json()
    assert tracking["current_stage"] == "LAVADOR"
    assert tracking["status"] == "IN_PROGRESS"


def test_list_tracking_events():
    response = client.get(f"/trackings/{state['tracking_id']}/events")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # COLHEITA (initial) + LAVADOR (added)


def test_get_tracking_qrcode():
    response = client.get(f"/trackings/{state['tracking_id']}/qrcode")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert "qrcode-" in response.headers["content-disposition"]


def test_complete_tracking_via_event():
    payload = {
        "stage": "FINALIZADO",
        "notes": "Processo concluído"
    }
    response = client.post(f"/trackings/{state['tracking_id']}/events", json=payload)
    assert response.status_code == 201
    
    # Verify tracking status is now COMPLETED
    tracking = client.get(f"/trackings/{state['tracking_id']}").json()
    assert tracking["current_stage"] == "FINALIZADO"
    assert tracking["status"] == "COMPLETED"
    assert tracking["completed_at"] is not None


def test_cannot_add_event_to_completed_tracking():
    payload = {
        "stage": "COMERCIALIZACAO"
    }
    response = client.post(f"/trackings/{state['tracking_id']}/events", json=payload)
    assert response.status_code == 400


def test_delete_tracking():
    response = client.delete(f"/trackings/{state['tracking_id']}")
    assert response.status_code == 204
    
    # Verify it's gone
    response = client.get(f"/trackings/{state['tracking_id']}")
    assert response.status_code == 404
