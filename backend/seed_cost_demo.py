# -*- coding: utf-8 -*-
"""
seed_cost_demo.py — Popula APENAS o domínio de custo (safras / máquinas /
trabalhadores / serviços / produção / apontamentos) numa API GoldBlack já semeada.

Diferente do enrich_demo.py, que é aditivo em TODAS as entidades (rodá-lo de novo
numa VM já semeada duplicaria fazendas/atividades/insumos/alertas), este script
reaproveita a fazenda e os talhões T-01..T-03 que já existem e cria só o que falta
para o Painel de Custo sair do zero. Tem guard próprio: se já houver safras, não
faz nada.

Reaproveita os helpers HTTP/login do enrich_demo (mesmo BASE, mesmo guard de HTTP
inseguro, mesmos contadores).

Uso:
    ALLOW_INSECURE=1 BASE=http://204.216.129.119 python seed_cost_demo.py
    BASE=http://localhost:8000 API_PREFIX="" python seed_cost_demo.py   # backend local direto
    ADMIN_EMAIL=x@y.com ADMIN_PASSWORD=senha ALLOW_INSECURE=1 python seed_cost_demo.py  # sem prompt
"""
import getpass
import os
import sys
from datetime import date

# Reaproveita a infraestrutura do enrich_demo (login/get/post/contadores/BASE).
# O import executa o guard de HTTP inseguro do enrich_demo — passe ALLOW_INSECURE=1
# quando apontar para a VM em HTTP puro, igual ao enrich_demo.
from enrich_demo import _login, get, post, created, BASE


def main():
    # ── Autenticação ────────────────────────────────────────────────────────
    email    = os.environ.get("ADMIN_EMAIL")    or input("E-mail do admin: ")
    password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Senha: ")
    if not _login(email, password):
        sys.exit(1)

    print(f"[*] Semeando domínio de custo em {BASE}\n")

    # ── Fazenda e talhões existentes (mesmo filtro anti-lixo do enrich_demo) ──
    farms = get("/farms") or []
    plots = get("/plots") or []
    if not farms:
        print("!! Nenhuma fazenda encontrada. Rode create_admin.py + enrich_demo.py primeiro.")
        sys.exit(1)

    farm1 = farms[0]
    real_plots = [p for p in plots
                  if p.get("variety") and not str(p["variety"]).isdigit()
                  and float(p["area_ha"]) < 1000]
    plot_by_code = {p["code"]: p for p in real_plots}
    t01 = plot_by_code.get("T-01")
    t02 = plot_by_code.get("T-02")
    t03 = plot_by_code.get("T-03")
    if not (t01 and t02 and t03):
        print("!! Talhões T-01/T-02/T-03 não encontrados. Rode enrich_demo.py primeiro.")
        sys.exit(1)

    # ── Domínio de custo (Safras / Máquinas / Trabalhadores / Serviços / Produção / Apontamentos)
    # É isto que faz o Painel de Custo sair do zero: o motor de custo apura por
    # talhão × safra a partir de atividades que carregam season_id e dos seus
    # lançamentos (insumo / mão de obra / hora-máquina).
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

        # Mapa nome→insumo (os insumos já foram criados pelo enrich_demo)
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
