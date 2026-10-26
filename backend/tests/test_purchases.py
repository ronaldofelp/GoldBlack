import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

_login = client.post("/auth/login", json={"email": "joao@goldblack.com.br", "password": "senha123"})
assert _login.status_code == 200, f"Login de teste falhou: {_login.text}"
client.headers.update({"Authorization": f"Bearer {_login.json()['access_token']}"})

state = {
    "farm_id": None,
    "supply_id": None,
    "purchase_id": None,
    "item_id": None,
    "initial_stock": None,
}


def setup_module(module):
    farms = client.get("/farms").json()
    state["farm_id"] = farms[0]["id"]

    supply_res = client.post("/supplies", json={
        "name": "Fertilizante Pytest",
        "category": "FERTILIZER",
        "unit_of_measure": "kg",
        "unit_cost": "2.50",
        "stock_quantity": "100.00",
    })
    assert supply_res.status_code == 201, f"Falha ao criar insumo: {supply_res.text}"
    state["supply_id"] = supply_res.json()["id"]
    state["initial_stock"] = float(supply_res.json()["stock_quantity"])


def test_create_purchase():
    payload = {
        "farm_id": state["farm_id"],
        "supplier": "Agro Fornecedor Ltda",
        "invoice_number": "NF-2026-001",
        "purchase_date": "2026-10-26",
        "total_value": "250.00",
        "notes": "Compra de teste pytest",
        "items": [
            {
                "supply_id": state["supply_id"],
                "quantity": "50.00",
                "unit_price": "2.50",
            }
        ],
    }
    res = client.post("/purchases", json=payload)
    assert res.status_code == 201, f"Falha ao criar compra: {res.text}"
    data = res.json()
    assert data["supplier"] == "Agro Fornecedor Ltda"
    assert data["status"] == "PENDING"
    assert len(data["items"]) == 1
    state["purchase_id"] = data["id"]
    state["item_id"] = data["items"][0]["id"]


def test_get_purchase():
    assert state["purchase_id"], "purchase_id não disponível"
    res = client.get(f"/purchases/{state['purchase_id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == state["purchase_id"]
    assert data["invoice_number"] == "NF-2026-001"


def test_list_purchases():
    res = client.get(f"/purchases?farm_id={state['farm_id']}")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    ids = [p["id"] for p in items]
    assert state["purchase_id"] in ids


def test_deliver_purchase_increments_stock():
    """Ao marcar como DELIVERED, stock_quantity do insumo deve aumentar pela quantidade do item."""
    supply_before = client.get(f"/supplies/{state['supply_id']}").json()
    stock_before = float(supply_before["stock_quantity"])

    res = client.put(f"/purchases/{state['purchase_id']}", json={"status": "DELIVERED"})
    assert res.status_code == 200, f"Falha ao atualizar compra: {res.text}"
    assert res.json()["status"] == "DELIVERED"

    supply_after = client.get(f"/supplies/{state['supply_id']}").json()
    stock_after = float(supply_after["stock_quantity"])

    assert stock_after == pytest.approx(stock_before + 50.0), (
        f"Estoque esperado {stock_before + 50.0}, obtido {stock_after}"
    )


def test_deliver_again_does_not_double_count():
    """Chamar DELIVERED novamente não deve incrementar o estoque uma segunda vez."""
    supply_mid = client.get(f"/supplies/{state['supply_id']}").json()
    stock_mid = float(supply_mid["stock_quantity"])

    res = client.put(f"/purchases/{state['purchase_id']}", json={"status": "DELIVERED"})
    assert res.status_code == 200

    supply_after = client.get(f"/supplies/{state['supply_id']}").json()
    stock_after = float(supply_after["stock_quantity"])

    assert stock_after == pytest.approx(stock_mid), (
        f"Estoque não deveria mudar (já DELIVERED): esperado {stock_mid}, obtido {stock_after}"
    )


def test_delete_purchase():
    res = client.delete(f"/purchases/{state['purchase_id']}")
    assert res.status_code == 204

    res = client.get(f"/purchases/{state['purchase_id']}")
    assert res.status_code == 404
