import React from 'react';
import { Modal } from './Modal';

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  /** Ocupa a linha inteira (útil para textos longos, ex.: mensagem/descrição). */
  full?: boolean;
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: DetailItem[];
}

// Painel somente-leitura para inspecionar um registro completo (drill-down do ERP).
// Recebe pares rótulo/valor já formatados pela própria página.
export function DetailModal({ isOpen, onClose, title, items }: DetailModalProps) {
  const isEmpty = (v: React.ReactNode) => v === null || v === undefined || v === '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="md">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex flex-col gap-1 ${item.full ? 'sm:col-span-2' : ''}`}
          >
            <dt className="text-xs uppercase tracking-wider text-text-muted">{item.label}</dt>
            <dd className="text-sm text-text-primary break-words">
              {isEmpty(item.value) ? <span className="text-text-muted">—</span> : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
