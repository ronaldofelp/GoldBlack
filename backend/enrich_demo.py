# -*- coding: utf-8 -*-
"""
enrich_demo.py — Popula a API GoldBlack (ao vivo) com dados de demonstração.

Ao contrário do mock_data.py (que faz drop_all/create_all e ZERA o banco),
este script apenas ADICIONA registros via HTTP POST na API existente.
Assim, os lotes de rastreio (QR) já configurados para a banca são preservados.

Uso:
    python enrich_demo.py                          # aponta para a VM de produção
    BASE=http://localhost:8000 API_PREFIX="" python enrich_demo.py   # backend local direto
    ADMIN_EMAIL=x@y.com ADMIN_PASSWORD=senha python enrich_demo.py  # sem prompt
"""
import getpass
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import date, timedelta

BASE       = os.environ.get("BASE", "http://204.216.129.119")
_API       = os.environ.get("API_PREFIX", "/api")   # "" se apontar direto ao backend:8000
_TOKEN: str | None = None

# Recusa enviar credenciais em HTTP puro para hosts não-locais.
# Quando HTTPS estiver ativo, troque o BASE para https:// e este guard passa
# automaticamente. Para usar em HTTP temporariamente (ex: antes do TLS):
#   ALLOW_INSECURE=1 python enrich_demo.py
_is_localhost = any(BASE.startswith(p) for p in ("http://localhost", "http://127.", "http://[::1]"))
if BASE.startswith("http://") and not _is_localhost and not os.environ.get("ALLOW_INSECURE"):
    sys.exit(
        "ERRO: recusando enviar credenciais de admin em HTTP puro.\n"
        "  → Quando HTTPS estiver ativo, use BASE=https://seu-dominio\n"
        "  → Para forçar HTTP temporariamente: ALLOW_INSECURE=1 python enrich_demo.py"
    )

created = {}  # contadores por entidade


def _req(method, path, payload=None):
    url = f"{BASE}{_API}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"}
    if _TOKEN:
        headers["Authorization"] = f"Bearer {_TOKEN}"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        print(f"   ! {method} {path} -> HTTP {e.code}: {detail[:160]}")
        return None


def _login(email: str, password: str) -> bool:
    """Autentica na API e armazena o token JWT globalmente."""
    global _TOKEN
    res = _req("POST", "/auth/login", {"email": email, "password": password})
    if res and res.get("access_token"):
        _TOKEN = res["access_token"]
        print(f"[*] Autenticado como {email}\n")
        return True
    print("!! Falha na autenticacao. Verifique e-mail/senha do admin.")
    return False


def get(path):
    return _req("GET", path)


def post(path, payload, label):
    res = _req("POST", path, payload)
    if res is not None:
        created[label] = created.get(label, 0) + 1
    return res


def main():
    # ── Autenticação ────────────────────────────────────────────────────────
    email    = os.environ.get("ADMIN_EMAIL")    or input("E-mail do admin: ")
    password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Senha: ")
    if not _login(email, password):
        sys.exit(1)

    print(f"[*] Enriquecendo API em {BASE}\n")

    # ── IDs existentes ou criados (banco pode estar vazio em produção) ─────────
    farms = get("/farms") or []
    users = get("/users") or []
    plots = get("/plots") or []

    if not users:
        print("!! Nenhum usuário encontrado. Execute create_admin.py primeiro.")
        sys.exit(1)

    # Fazenda principal — cria se o banco estiver vazio
    farm1 = farms[0] if farms else None
    if not farm1:
        print("[*] Banco vazio — criando fazenda base...")
        farm1 = post("/farms", {
            "producer_id": users[0]["id"],
            "name": "Fazenda Ouro Preto",
            "total_area_ha": 145.0,
        }, "farms")
        if not farm1:
            print("!! Falha ao criar fazenda base. Abortando.")
            sys.exit(1)

    producer_id = farm1["producer_id"]

    # Talhões base T-01..T-04 — cria os que ainda não existem
    real_plots = [p for p in plots
                  if p.get("variety") and not str(p["variety"]).isdigit()
                  and float(p["area_ha"]) < 1000]
    plot_by_code = {p["code"]: p for p in real_plots}
    for code, area, variety, yr in [
        ("T-01", 45.0, "Catuaí Vermelho", 2015),
        ("T-02", 32.0, "Bourbon Amarelo",  2018),
        ("T-03", 28.0, "Mundo Novo",       2012),
        ("T-04", 22.0, "Catuaí Amarelo",   2020),
    ]:
        if code not in plot_by_code:
            p = post("/plots", {
                "farm_id": farm1["id"], "code": code, "area_ha": area,
                "variety": variety, "planting_year": yr, "status": "IN_PRODUCTION",
            }, "plots")
            if p:
                plot_by_code[code] = p
                real_plots.append(p)

    agronomist = next((u for u in users if u["role"] == "OPERATOR"), users[0])
    agro_id = agronomist["id"]

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

    # ── Domínio de custo (Safras / Máquinas / Trabalhadores / Serviços / Produção / Apontamentos)
    # É isto que faz o Painel de Custo sair do zero: o motor de custo apura por
    # talhão × safra a partir de atividades que carregam season_id e dos seus
    # lançamentos (insumo / mão de obra / hora-máquina). As atividades genéricas
    # acima NÃO têm season_id de propósito — as de custo abaixo têm.
    print("[*] Dominio de custo (safras/maquinas/trabalhadores/servicos/producao)...")
    if get("/seasons"):
        print("   (safras ja existem — pulando seed de custo para nao duplicar)")
    else:
        # Safras — o nome PRECISA casar com harvest_season dos lotes p/ apurar receita
        season_by_name = {}
        for name, s_start, s_end in [
            ("2024/2025", date(2024, 7, 1), date(2025, 6, 30)),
            ("2025/2026", date(2025, 7, 1), date(2026, 6, 30)),
        ]:
            s = post("/seasons", {
                "name": name, "start_date": s_start.isoformat(), "end_date": s_end.isoformat(),
            }, "seasons")
            if s:
                season_by_name[name] = s

        # Máquinas (custo/hora)
        machine_by_name = {}
        for name, hourly in [
            ("Trator John Deere 5090E", 145.0),
            ("Colhedora Jacto KTR", 320.0),
            ("Pulverizador Autopropelido", 210.0),
        ]:
            m = post("/machines", {"farm_id": farm1["id"], "name": name, "hourly_cost": hourly}, "machines")
            if m:
                machine_by_name[name] = m

        # Trabalhadores (diária)
        worker_by_name = {}
        for name, wtype, daily in [
            ("Jose da Silva", "REGISTERED", 130.0),
            ("Antonio Pereira", "REGISTERED", 130.0),
            ("Equipe Volante", "THIRD_PARTY", 120.0),
        ]:
            w = post("/workers", {"farm_id": farm1["id"], "name": name, "type": wtype, "daily_rate": daily}, "workers")
            if w:
                worker_by_name[name] = w

        # Definições de serviço (empreita)
        service_by_name = {}
        for name, unit_desc, unit_value in [
            ("Colheita (empreita por saca)", "R$ por saca colhida", 45.0),
            ("Rocada mecanizada", "R$ por hectare", 90.0),
        ]:
            sd = post("/service-definitions", {
                "farm_id": farm1["id"], "name": name,
                "unit_description": unit_desc, "unit_value": unit_value,
            }, "service-definitions")
            if sd:
                service_by_name[name] = sd

        # Mapa nome→insumo (os insumos já foram criados acima nesta mesma execução)
        supply_by_name = {s["name"]: s for s in (get("/supplies") or [])}

        # Produção (talhão × safra → sacas) — habilita custo/saca
        for plot, season_name, sacks, hdate in [
            (t01, "2024/2025", 1300, date(2025, 7, 5)),
            (t02, "2025/2026", 780,  date(2026, 7, 8)),
            (t03, "2025/2026", 410,  date(2026, 7, 20)),
        ]:
            season = season_by_name.get(season_name)
            if not plot or not season:
                continue
            post("/productions", {
                "plot_id": plot["id"], "season_id": season["id"],
                "sacks_produced": sacks, "harvest_date": hdate.isoformat(),
            }, "productions")

        def seed_cost_activity(plot, season_name, typ, a_start, a_end, status,
                               supplies=None, labor=None, machines=None):
            """Cria uma atividade COM season_id e anexa os lançamentos de custo."""
            season = season_by_name.get(season_name)
            if not plot or not season:
                return
            payload = {
                "plot_id": plot["id"], "season_id": season["id"],
                "type": typ, "start_date": a_start.isoformat(), "status": status,
            }
            if a_end:
                payload["end_date"] = a_end.isoformat()
            act = post("/activities", payload, "activities (custo)")
            if not act:
                return
            aid = act["id"]
            for supply_name, qty in (supplies or []):
                sup = supply_by_name.get(supply_name)
                if sup:
                    post(f"/activities/{aid}/supplies",
                         {"supply_id": sup["id"], "applied_quantity": qty}, "apontamentos insumo")
            for entry in (labor or []):
                kind = entry[0]
                if kind == "DIARIA":
                    w = worker_by_name.get(entry[1])
                    if w:
                        post(f"/activities/{aid}/labor",
                             {"labor_type": "DIARIA", "worker_id": w["id"], "quantity": entry[2]},
                             "apontamentos mao de obra")
                elif kind == "SERVICO":
                    sd = service_by_name.get(entry[1])
                    if sd:
                        post(f"/activities/{aid}/labor",
                             {"labor_type": "SERVICO", "service_definition_id": sd["id"], "quantity": entry[2]},
                             "apontamentos mao de obra")
            for machine_name, hours in (machines or []):
                m = machine_by_name.get(machine_name)
                if m:
                    post(f"/activities/{aid}/machine-usage",
                         {"machine_id": m["id"], "hours": hours}, "apontamentos hora-maquina")

        # T-01 × 2024/2025 (lote vendido por R$ 63.500 → apuração lucrativa)
        seed_cost_activity(t01, "2024/2025", "FERTILIZATION", date(2024, 8, 10), date(2024, 8, 12), "COMPLETED",
            supplies=[("Sulfato de Amonio 21% N", 2000), ("MAP (Fosfato Monoamonico)", 900), ("Cloreto de Potassio (KCl)", 1200)],
            labor=[("DIARIA", "Jose da Silva", 6), ("DIARIA", "Antonio Pereira", 6)],
            machines=[("Trator John Deere 5090E", 8)])
        seed_cost_activity(t01, "2024/2025", "PRUNING", date(2024, 8, 20), date(2024, 8, 24), "COMPLETED",
            labor=[("DIARIA", "Equipe Volante", 20)],
            machines=[("Trator John Deere 5090E", 6)])
        seed_cost_activity(t01, "2024/2025", "HARVEST", date(2025, 6, 10), date(2025, 7, 5), "COMPLETED",
            labor=[("SERVICO", "Colheita (empreita por saca)", 400)],
            machines=[("Colhedora Jacto KTR", 20)])

        # T-02 × 2025/2026 (lote vendido por R$ 79.000 → apuração lucrativa)
        seed_cost_activity(t02, "2025/2026", "FERTILIZATION", date(2025, 8, 5), date(2025, 8, 7), "COMPLETED",
            supplies=[("Sulfato de Amonio 21% N", 1500), ("MAP (Fosfato Monoamonico)", 700), ("Cloreto de Potassio (KCl)", 900)],
            labor=[("DIARIA", "Jose da Silva", 5), ("DIARIA", "Antonio Pereira", 5)],
            machines=[("Trator John Deere 5090E", 6)])
        seed_cost_activity(t02, "2025/2026", "PESTICIDE_APPLICATION", date(2025, 9, 1), date(2025, 9, 1), "COMPLETED",
            supplies=[("Glifosato 480 g/L", 60), ("Oxicloreto de Cobre", 40)],
            labor=[("DIARIA", "Equipe Volante", 3)],
            machines=[("Pulverizador Autopropelido", 5)])
        seed_cost_activity(t02, "2025/2026", "PRUNING", date(2025, 8, 15), date(2025, 8, 18), "COMPLETED",
            labor=[("DIARIA", "Equipe Volante", 18)],
            machines=[("Trator John Deere 5090E", 5)])
        seed_cost_activity(t02, "2025/2026", "HARVEST", date(2026, 6, 1), date(2026, 6, 25), "COMPLETED",
            labor=[("SERVICO", "Colheita (empreita por saca)", 700)],
            machines=[("Colhedora Jacto KTR", 22)])

        # T-03 × 2025/2026 (sem venda → apuração deficitária: mostra talhão no vermelho)
        seed_cost_activity(t03, "2025/2026", "FERTILIZATION", date(2025, 9, 2), date(2025, 9, 3), "COMPLETED",
            supplies=[("Sulfato de Amonio 21% N", 800), ("Cloreto de Potassio (KCl)", 500)],
            labor=[("DIARIA", "Jose da Silva", 4)],
            machines=[("Trator John Deere 5090E", 4)])
        seed_cost_activity(t03, "2025/2026", "HARVEST", date(2026, 6, 15), date(2026, 6, 28), "COMPLETED",
            labor=[("DIARIA", "Equipe Volante", 40)],
            machines=[("Colhedora Jacto KTR", 10)])

    # ── Resumo ───────────────────────────────────────────────────────────────
    print("\n" + "-" * 50)
    print("Resumo de registros criados:")
    for k in sorted(created):
        print(f"   + {created[k]:>3}  {k}")
    print("-" * 50)
    print("Concluido. Nenhum dado existente foi apagado.")


if __name__ == "__main__":
    main()
