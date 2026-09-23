import { useEffect, useState, useCallback } from 'react';
import { Trash2, Plus, Package, Users, Tractor, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import {
  activityCostApi, costApi, suppliesApi, workersApi, serviceDefinitionsApi, machinesApi,
} from '../../services/api';
import type {
  ActivitySupply, LaborEntry, MachineUsage, ActivityCostBreakdown,
  AgriculturalSupply, Worker, ServiceDefinition, Machine, LaborType,
} from '../../types';

const brl = (v: number | null | undefined) =>
  v == null ? '—' : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

interface Props {
  activityId: string;
  onClose: () => void;
}

/** Modal de apontamentos de custo de uma atividade: insumos, mão de obra e hora-máquina. */
export function ActivityCostModal({ activityId, onClose }: Props) {
  const [supplies, setSupplies] = useState<ActivitySupply[]>([]);
  const [labor, setLabor] = useState<LaborEntry[]>([]);
  const [usage, setUsage] = useState<MachineUsage[]>([]);
  const [cost, setCost] = useState<ActivityCostBreakdown | null>(null);

  // Dados de referência (catálogos)
  const [supplyCatalog, setSupplyCatalog] = useState<AgriculturalSupply[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [s, l, u, c] = await Promise.all([
        activityCostApi.listSupplies(activityId),
        activityCostApi.listLabor(activityId),
        activityCostApi.listMachineUsage(activityId),
        costApi.activityCost(activityId),
      ]);
      setSupplies(s.data);
      setLabor(l.data);
      setUsage(u.data);
      setCost(c.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar apontamentos');
    }
  }, [activityId]);

  useEffect(() => {
    (async () => {
      const [sc, w, sv, m] = await Promise.all([
        suppliesApi.list(), workersApi.list(), serviceDefinitionsApi.list(), machinesApi.list(),
      ]);
      setSupplyCatalog(sc.data);
      setWorkers(w.data);
      setServices(sv.data);
      setMachines(m.data);
    })().catch((err) => setError(err.message));
    reload();
  }, [reload]);

  const supplyName = (id: string) => supplyCatalog.find((s) => s.id === id)?.name ?? id;
  const workerName = (id: string | null) => workers.find((w) => w.id === id)?.name ?? '—';
  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name ?? '—';
  const machineName = (id: string) => machines.find((m) => m.id === id)?.name ?? id;

  return (
    <Modal isOpen onClose={onClose} title="Apontamentos de custo da atividade">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-negative/10 border border-negative/20 text-negative-light text-sm rounded">{error}</div>
        )}

        {/* Resumo do custo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CostChip label="Insumos" value={cost?.supplies_cost} />
          <CostChip label="Mão de obra" value={cost?.labor_cost} />
          <CostChip label="Máquina" value={cost?.machine_cost} />
          <CostChip label="Total" value={cost?.total_cost} accent />
        </div>

        {/* Insumos */}
        <Section icon={<Package size={16} />} title="Insumos">
          <SupplyForm
            catalog={supplyCatalog}
            onAdd={async (payload) => { await activityCostApi.addSupply(activityId, payload); reload(); }}
          />
          <ItemList
            rows={supplies.map((s) => ({
              key: s.supply_id,
              label: supplyName(s.supply_id),
              detail: `${Number(s.applied_quantity)} un`,
              value: brl(s.total_cost),
              onDelete: async () => { await activityCostApi.removeSupply(activityId, s.supply_id); reload(); },
            }))}
          />
        </Section>

        {/* Mão de obra */}
        <Section icon={<Users size={16} />} title="Mão de obra">
          <LaborForm
            workers={workers}
            services={services}
            onAdd={async (payload) => { await activityCostApi.addLabor(activityId, payload); reload(); }}
          />
          <ItemList
            rows={labor.map((l) => ({
              key: l.id,
              label: l.labor_type === 'DIARIA' ? `Diária · ${workerName(l.worker_id)}` : `Serviço · ${serviceName(l.service_definition_id)}`,
              detail: `${Number(l.quantity)}${l.unit_value != null ? ` × ${brl(l.unit_value)}` : ''}`,
              value: '',
              onDelete: async () => { await activityCostApi.removeLabor(activityId, l.id); reload(); },
            }))}
          />
        </Section>

        {/* Hora-máquina */}
        <Section icon={<Tractor size={16} />} title="Hora-máquina">
          <MachineForm
            machines={machines}
            onAdd={async (payload) => { await activityCostApi.addMachineUsage(activityId, payload); reload(); }}
          />
          <ItemList
            rows={usage.map((u) => ({
              key: u.id,
              label: machineName(u.machine_id),
              detail: `${Number(u.hours)} h`,
              value: '',
              onDelete: async () => { await activityCostApi.removeMachineUsage(activityId, u.id); reload(); },
            }))}
          />
        </Section>

        <div className="flex justify-end pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-background bg-gold hover:bg-gold-light rounded transition-colors shadow-gold">
            Concluir
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Blocos auxiliares ─────────────────────────────────────────────────────────

function CostChip({ label, value, accent }: { label: string; value?: number | null; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? 'border-gold/40 bg-gold/5' : 'border-border bg-background'}`}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm font-bold mt-1 ${accent ? 'text-gold' : 'text-text-primary'}`}>{brl(value)}</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2">
        <span className="text-gold">{icon}</span>{title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface Row { key: string; label: string; detail: string; value: string; onDelete: () => Promise<void>; }

function ItemList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="text-xs text-text-muted italic">Nenhum lançamento.</p>;
  return (
    <ul className="divide-y divide-border/50 border border-border rounded-lg">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-3 px-3 py-2 text-sm">
          <span className="flex-1 text-text-primary truncate">{r.label}</span>
          <span className="text-text-muted text-xs">{r.detail}</span>
          {r.value && <span className="text-text-primary font-medium w-24 text-right">{r.value}</span>}
          <button onClick={() => r.onDelete().catch(() => {})} className="p-1 rounded text-text-muted hover:text-negative transition-colors" title="Remover">
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddButton({ busy }: { busy: boolean }) {
  return (
    <button type="submit" disabled={busy}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-background bg-gold/90 hover:bg-gold rounded transition-colors disabled:opacity-50">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Adicionar
    </button>
  );
}

function SupplyForm({ catalog, onAdd }: { catalog: AgriculturalSupply[]; onAdd: (p: { supply_id: string; applied_quantity: number }) => Promise<void> }) {
  const [supplyId, setSupplyId] = useState('');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyId || !qty) return;
    setBusy(true);
    try { await onAdd({ supply_id: supplyId, applied_quantity: Number(qty) }); setSupplyId(''); setQty(''); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <select className="input-base flex-1 min-w-[160px]" value={supplyId} onChange={(e) => setSupplyId(e.target.value)} required>
        <option value="">Insumo...</option>
        {catalog.map((s) => <option key={s.id} value={s.id}>{s.name} ({brl(s.unit_cost)}/{s.unit_of_measure})</option>)}
      </select>
      <input className="input-base w-28" type="number" step="any" placeholder="Qtd" value={qty} onChange={(e) => setQty(e.target.value)} required />
      <AddButton busy={busy} />
    </form>
  );
}

function MachineForm({ machines, onAdd }: { machines: Machine[]; onAdd: (p: { machine_id: string; hours: number }) => Promise<void> }) {
  const [machineId, setMachineId] = useState('');
  const [hours, setHours] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !hours) return;
    setBusy(true);
    try { await onAdd({ machine_id: machineId, hours: Number(hours) }); setMachineId(''); setHours(''); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <select className="input-base flex-1 min-w-[160px]" value={machineId} onChange={(e) => setMachineId(e.target.value)} required>
        <option value="">Máquina...</option>
        {machines.map((m) => <option key={m.id} value={m.id}>{m.name} ({brl(m.hourly_cost)}/h)</option>)}
      </select>
      <input className="input-base w-28" type="number" step="any" placeholder="Horas" value={hours} onChange={(e) => setHours(e.target.value)} required />
      <AddButton busy={busy} />
    </form>
  );
}

function LaborForm({ workers, services, onAdd }: {
  workers: Worker[]; services: ServiceDefinition[];
  onAdd: (p: Omit<LaborEntry, 'id' | 'activity_id'>) => Promise<void>;
}) {
  const [laborType, setLaborType] = useState<LaborType>('DIARIA');
  const [refId, setRefId] = useState('');
  const [qty, setQty] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty) return;
    setBusy(true);
    try {
      await onAdd({
        labor_type: laborType,
        worker_id: laborType === 'DIARIA' ? (refId || null) : null,
        service_definition_id: laborType === 'SERVICO' ? (refId || null) : null,
        quantity: Number(qty),
        unit_value: unitValue ? Number(unitValue) : null,
      });
      setRefId(''); setQty(''); setUnitValue('');
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <select className="input-base w-32" value={laborType} onChange={(e) => { setLaborType(e.target.value as LaborType); setRefId(''); }}>
        <option value="DIARIA">Diária</option>
        <option value="SERVICO">Serviço</option>
      </select>
      {laborType === 'DIARIA' ? (
        <select className="input-base flex-1 min-w-[140px]" value={refId} onChange={(e) => setRefId(e.target.value)}>
          <option value="">Trabalhador...</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}{w.daily_rate != null ? ` (${brl(w.daily_rate)})` : ''}</option>)}
        </select>
      ) : (
        <select className="input-base flex-1 min-w-[140px]" value={refId} onChange={(e) => setRefId(e.target.value)}>
          <option value="">Serviço...</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({brl(s.unit_value)})</option>)}
        </select>
      )}
      <input className="input-base w-24" type="number" step="any" placeholder={laborType === 'DIARIA' ? 'Diárias' : 'Qtd'} value={qty} onChange={(e) => setQty(e.target.value)} required />
      <input className="input-base w-28" type="number" step="any" placeholder="Valor un. (opc.)" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} />
      <AddButton busy={busy} />
    </form>
  );
}
