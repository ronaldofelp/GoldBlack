# -*- coding: utf-8 -*-
"""
enrich_demo.py — Popula a API GoldBlack (ao vivo) com dados de demonstração.

Ao contrário do mock_data.py (que faz drop_all/create_all e ZERA o banco),
este script apenas ADICIONA registros via HTTP POST na API existente.
Assim, os lotes de rastreio (QR) já configurados para a banca são preservados.

Uso:
    python enrich_demo.py                      # usa a VM ao vivo
    BASE=http://localhost:8000 python enrich_demo.py
"""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import date, timedelta

BASE = os.environ.get("BASE", "http://164.152.53.29:8000")

created = {}  # contadores por entidade


def _req(method, path, payload=None):
    url = f"{BASE}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        print(f"   ! {method} {path} -> HTTP {e.code}: {detail[:160]}")
        return None


def get(path):
    return _req("GET", path)


def post(path, payload, label):
    res = _req("POST", path, payload)
    if res is not None:
        created[label] = created.get(label, 0) + 1
    return res


def main():
    print(f"[*] Enriquecendo API em {BASE}\n")

    # ── IDs existentes ──────────────────────────────────────────────────────
    farms = get("/farms")
    users = get("/users")
    plots = get("/plots")
    if not farms or not users:
        print("!! API sem farm/user base. Abortando.")
        sys.exit(1)

    farm1 = farms[0]
    producer_id = farm1["producer_id"]
    agronomist = next((u for u in users if u["role"] == "OPERATOR"), users[0])
    agro_id = agronomist["id"]

    # talhões "de verdade" (ignora lixo de teste com variety numérica/áreas absurdas)
    real_plots = [p for p in plots
                  if p.get("variety") and not str(p["variety"]).isdigit()
                  and float(p["area_ha"]) < 1000]
    plot_by_code = {p["code"]: p for p in real_plots}

    # ── 2ª propriedade + talhões (dá vida à tela Propriedades) ──────────────
    print("[*] 2a propriedade + talhoes...")
    farm2 = post("/farms", {
        "producer_id": producer_id,
        "name": "Sitio Boa Vista",
        "total_area_ha": 68.0,
    }, "farms")
    new_plots = []
    if farm2:
        for code, area, variety, yr in [
            ("BV-01", 22.0, "Acaia", 2017),
            ("BV-02", 18.5, "Catucai Amarelo", 2020),
        ]:
            p = post("/plots", {
                "farm_id": farm2["id"], "code": code, "area_ha": area,
                "variety": variety, "planting_year": yr, "status": "IN_PRODUCTION",
            }, "plots")
            if p:
                new_plots.append(p)

    all_plots = real_plots + new_plots
    t01 = plot_by_code.get("T-01")
    t02 = plot_by_code.get("T-02")
    t03 = plot_by_code.get("T-03")

    # ── Insumos (Estoque) ───────────────────────────────────────────────────
    print("[*] Insumos...")
    for name, cat, unit, cost, stock in [
        ("Sulfato de Amonio 21% N", "FERTILIZER", "kg", 2.95, 8000),
        ("MAP (Fosfato Monoamonico)", "FERTILIZER", "kg", 4.40, 3200),
        ("Cloreto de Potassio (KCl)", "FERTILIZER", "kg", 3.10, 6500),
        ("Calcario Dolomitico", "FERTILIZER", "t", 145.00, 40),
        ("Glifosato 480 g/L", "PESTICIDE", "L", 22.90, 300),
        ("Oxicloreto de Cobre", "PESTICIDE", "kg", 34.50, 150),
    ]:
        post("/supplies", {
            "name": name, "category": cat, "unit_of_measure": unit,
            "unit_cost": cost, "stock_quantity": stock,
        }, "supplies")

    # ── Atividades (Lavouras: Atividades/Tratos/Adubacoes/Irrigacoes/Colheita)
    print("[*] Atividades agricolas (todos os tipos)...")
    # (plot, tipo, inicio, fim, status, horas, custo_mo)
    acts = [
        (t01, "PRUNING",               date(2025, 2, 10), date(2025, 2, 14), "COMPLETED", 40, 1200),
        (t02, "PRUNING",               date(2025, 2, 18), date(2025, 2, 20), "COMPLETED", 24, 720),
        (t03, "PRUNING",               date(2025, 8, 1),  None,              "PENDING",   None, None),
        (t01, "FERTILIZATION",         date(2025, 3, 5),  date(2025, 3, 6),  "COMPLETED", 16, 480),
        (t02, "FERTILIZATION",         date(2025, 3, 12), date(2025, 3, 13), "COMPLETED", 14, 420),
        (t03, "FERTILIZATION",         date(2025, 9, 2),  None,              "IN_PROGRESS", 8, 240),
        (t01, "IRRIGATION",            date(2025, 4, 1),  date(2025, 4, 1),  "COMPLETED", 6, 180),
        (t02, "IRRIGATION",            date(2025, 4, 15), date(2025, 4, 15), "COMPLETED", 5, 150),
        (t03, "IRRIGATION",            date(2025, 9, 20), None,              "PENDING",   None, None),
        (t01, "PESTICIDE_APPLICATION", date(2025, 5, 8),  date(2025, 5, 8),  "COMPLETED", 7, 350),
        (t02, "PESTICIDE_APPLICATION", date(2025, 5, 22), date(2025, 5, 22), "COMPLETED", 6, 300),
        (t01, "HARVEST",               date(2025, 6, 15), date(2025, 7, 5),  "COMPLETED", 320, 9600),
        (t02, "HARVEST",               date(2025, 6, 20), date(2025, 7, 10), "COMPLETED", 260, 7800),
        (t03, "HARVEST",               date(2026, 6, 1),  None,              "PENDING",   None, None),
    ]
    for plot, typ, start, end, status, hours, cost in acts:
        if not plot:
            continue
        payload = {
            "plot_id": plot["id"], "type": typ,
            "start_date": start.isoformat(),
            "status": status,
        }
        if end:
            payload["end_date"] = end.isoformat()
        if hours is not None:
            payload["worked_hours"] = hours
        if cost is not None:
            payload["labor_cost"] = cost
        post("/activities", payload, "activities")

    # ── Analises de solo ────────────────────────────────────────────────────
    print("[*] Analises de solo...")
    for plot, dt, ph, mo in [
        (t01, date(2025, 3, 15), 6.2, 3.8),
        (t02, date(2025, 3, 16), 5.6, 2.9),
        (t03, date(2025, 3, 18), 5.1, 2.2),
        (t01, date(2026, 2, 10), 6.4, 4.1),
    ]:
        if not plot:
            continue
        post("/soil-analyses", {
            "plot_id": plot["id"], "collection_date": dt.isoformat(),
            "ph": ph, "organic_matter": mo,
            "report_url": f"https://goldblack.com/laudos/solo-{plot['code']}-{dt.year}.pdf",
        }, "soil-analyses")

    # ── Estimativas de safra ────────────────────────────────────────────────
    print("[*] Estimativas de safra...")
    for plot, season, sacks, ypha in [
        (t02, "2025/2026", 780, 26),
        (t03, "2025/2026", 410, 16),
        (t01, "2026/2027", 1400, 31),
        (t02, "2026/2027", 820, 27),
    ]:
        if not plot:
            continue
        post("/harvest-estimates", {
            "plot_id": plot["id"], "season": season,
            "estimated_sacks": sacks, "estimated_yield_per_ha": ypha,
        }, "harvest-estimates")

    # ── Recomendacoes tecnicas ──────────────────────────────────────────────
    print("[*] Recomendacoes tecnicas...")
    for plot, desc, issue, deadline, status in [
        (t02, "Adubacao de cobertura com 300 kg/ha de KCl apos as primeiras chuvas.",
         date(2025, 9, 10), date(2025, 11, 10), "PENDING"),
        (t03, "Monitorar bicho-mineiro; aplicar controle se atingir 30% de folhas minadas.",
         date(2025, 8, 20), date(2025, 10, 1), "PENDING"),
        (t01, "Correcao de pH concluida; manter calagem de manutencao anual.",
         date(2025, 4, 1), date(2025, 6, 1), "COMPLETED"),
    ]:
        if not plot:
            continue
        post("/recommendations", {
            "agronomist_id": agro_id, "plot_id": plot["id"], "description": desc,
            "issue_date": issue.isoformat(), "deadline": deadline.isoformat(),
            "status": status,
        }, "recommendations")

    # ── Alertas (Monitoramento) ─────────────────────────────────────────────
    print("[*] Alertas...")
    for plot, atype, msg in [
        (t01, "WEATHER", "Alta probabilidade de chuva forte nas proximas 24h. Suspender pulverizacoes."),
        (t02, "AGRONOMIC", "Incidencia de ferrugem acima do limiar no talhao T-02. Avaliar controle."),
        (None, "SYSTEM", "Backup diario dos dados concluido com sucesso."),
        (t03, "AGRONOMIC", "Deficit hidrico detectado no talhao T-03. Considerar irrigacao."),
        (None, "WEATHER", "Onda de calor prevista para a semana. Atencao a mudas novas."),
    ]:
        payload = {"farm_id": farm1["id"], "alert_type": atype, "message": msg}
        if plot:
            payload["plot_id"] = plot["id"]
        post("/alerts", payload, "alerts")

    # ── Registros climaticos (API completeness) ─────────────────────────────
    print("[*] Registros climaticos...")
    base_day = date(2025, 9, 1)
    series = [(23, 0, 62), (24, 2, 65), (22, 15, 78), (21, 40, 85), (25, 0, 58),
              (26, 0, 55), (24, 8, 70), (20, 55, 88), (23, 3, 66), (25, 1, 60)]
    for i, (temp, prec, hum) in enumerate(series):
        post("/weather-logs", {
            "farm_id": farm1["id"],
            "log_date": (base_day + timedelta(days=i)).isoformat(),
            "temperature_celsius": temp, "precipitation_mm": prec,
            "relative_humidity": hum,
        }, "weather-logs")

    # ── Lotes de rastreabilidade (Producao) ─────────────────────────────────
    print("[*] Lotes de producao...")
    batch_defs = [
        (t01, "2024/2025", "GB-T01-2024-002", "PULPED_NATURAL", date(2024, 7, 2), 300),
        (t02, "2025/2026", "GB-T02-2025-001", "NATURAL",        date(2025, 7, 8), 220),
        (t03, "2025/2026", "GB-T03-2025-001", "NATURAL",        date(2025, 7, 20), 150),
    ]
    new_batches = []
    for plot, season, code, ctype, hdate, vol in batch_defs:
        if not plot:
            continue
        b = post("/batches", {
            "plot_id": plot["id"], "harvest_season": season, "batch_code": code,
            "coffee_type": ctype, "harvest_date": hdate.isoformat(),
            "total_volume_measures": vol,
        }, "batches")
        if b:
            new_batches.append(b)

    # ── Vendas (uma por lote novo) ──────────────────────────────────────────
    print("[*] Vendas...")
    sale_defs = [
        ("REM-2025-4602", "Armazem Cerrado Log", "NF-2025-9012",
         date(2025, 8, 25), "Cafe Especial Origem Ltda.", 63500),
        ("REM-2024-3980", "Armazem Santos Export", "NF-2024-7711",
         date(2024, 9, 10), "Torrefacao Aurora S/A", 79000),
    ]
    for i, sd in enumerate(sale_defs):
        if i >= len(new_batches):
            break
        ship, dest, inv, sdate, cust, val = sd
        post("/sales", {
            "batch_id": new_batches[i]["id"], "shipment_invoice": ship,
            "destination_warehouse": dest, "sale_invoice": inv,
            "sale_date": sdate.isoformat(), "customer": cust, "total_value": val,
        }, "sales")

    # ── Transacoes financeiras (Financeiro) ─────────────────────────────────
    print("[*] Transacoes financeiras...")
    tx = [
        ("INCOME",  "COFFEE_SALE", 63500, date(2025, 8, 25), date(2025, 8, 27), "PAID"),
        ("INCOME",  "COFFEE_SALE", 79000, date(2024, 9, 10), date(2024, 9, 12), "PAID"),
        ("INCOME",  "COFFEE_SALE", 42500, date(2025, 5, 10), date(2025, 5, 12), "PAID"),
        ("EXPENSE", "SUPPLY",       9100, date(2025, 6, 1),  date(2025, 6, 1),  "PAID"),
        ("EXPENSE", "SUPPLY",       5800, date(2025, 3, 20), date(2025, 3, 20), "PAID"),
        ("EXPENSE", "LABOR",       12500, date(2025, 9, 5),  None,              "PENDING"),
        ("EXPENSE", "LABOR",        9600, date(2025, 7, 5),  date(2025, 7, 6),  "PAID"),
        ("EXPENSE", "MAINTENANCE",  3200, date(2025, 7, 15), date(2025, 7, 15), "PAID"),
        ("EXPENSE", "MAINTENANCE",  4700, date(2025, 10, 2), None,              "PENDING"),
        ("EXPENSE", "SUPPLY",       6400, date(2026, 2, 12), None,              "PENDING"),
    ]
    for typ, cat, amt, due, pay, status in tx:
        payload = {
            "farm_id": farm1["id"], "type": typ, "category": cat,
            "amount": amt, "due_date": due.isoformat(), "status": status,
        }
        if pay:
            payload["payment_date"] = pay.isoformat()
        post("/transactions", payload, "transactions")

    # ── Rastreios QR extras (Rastreio) ──────────────────────────────────────
    # Avanca lotes novos por algumas etapas para a lista de rastreio ficar rica.
    print("[*] Rastreios QR extras...")
    stage_paths = {
        0: ["LAVADOR", "TERREIRO", "SECADOR", "TULHA", "BENEFICIAMENTO",
            "CLASSIFICACAO", "COMERCIALIZACAO", "FINALIZADO"],   # lote 1 -> finalizado
        1: ["LAVADOR", "TERREIRO"],                               # lote 2 -> em andamento
    }
    for idx, stages in stage_paths.items():
        if idx >= len(new_batches):
            break
        b = new_batches[idx]
        tr = post("/trackings", {
            "batch_id": b["id"],
            "description": f"Cafe {b['batch_code']} - rastreio de demonstracao",
        }, "trackings")
        if not tr:
            continue
        for st in stages:
            _req("POST", f"/trackings/{tr['id']}/events", {
                "stage": st, "recorded_by": "Equipe GoldBlack",
                "notes": None,
            })

    # ── Resumo ───────────────────────────────────────────────────────────────
    print("\n" + "-" * 50)
    print("Resumo de registros criados:")
    for k in sorted(created):
        print(f"   + {created[k]:>3}  {k}")
    print("-" * 50)
    print("Concluido. Nenhum dado existente foi apagado.")


if __name__ == "__main__":
    main()
