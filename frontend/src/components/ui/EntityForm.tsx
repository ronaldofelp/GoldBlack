import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'password';

export interface FieldOption {
  value: string | number;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: FieldOption[]; // Para o tipo 'select'
  required?: boolean;
  defaultValue?: any;
}

interface EntityFormProps {
  fields: FieldDef[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function EntityForm({ fields, onSubmit, onCancel, submitLabel = 'Salvar' }: EntityFormProps) {
  // Inicializa o estado com base nos valores padrão ou strings vazias
  const initialState: Record<string, any> = {};
  fields.forEach(f => {
    initialState[f.name] = f.defaultValue !== undefined ? f.defaultValue : (f.type === 'boolean' ? false : '');
  });

  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Converte os valores para os tipos apropriados antes do envio
      const parsedData = { ...formData };
      fields.forEach(f => {
        if (f.type === 'number') {
          parsedData[f.name] = parsedData[f.name] !== '' ? Number(parsedData[f.name]) : null;
        } else if (f.type === 'boolean') {
          parsedData[f.name] = Boolean(parsedData[f.name]);
        }
      });
      
      await onSubmit(parsedData);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-negative/10 border border-negative/20 text-negative-light text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              {field.label} {field.required && <span className="text-negative">*</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                className="input-base"
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">Selecione...</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'boolean' ? (
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-gold bg-background border-border rounded focus:ring-gold focus:ring-2 focus:ring-offset-background"
                  checked={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                />
              </div>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'password' ? 'password' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                autoComplete={field.type === 'password' ? 'new-password' : undefined}
                className="input-base"
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-text-primary bg-transparent hover:bg-card-hover border border-border rounded transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-gold hover:bg-gold-light rounded transition-colors shadow-gold disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
