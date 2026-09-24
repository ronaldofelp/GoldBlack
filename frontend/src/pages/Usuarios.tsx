import { useEffect, useState } from 'react';
import { Users, Trash2, ShieldAlert } from 'lucide-react';
import { EntityPageLayout } from '../components/layout/EntityPageLayout';
import { Modal } from '../components/ui/Modal';
import { EntityForm, type FieldDef } from '../components/ui/EntityForm';
import { usersApi } from '../services/api';
import { useAuth, ROLE_LABELS } from '../contexts/AuthContext';
import type { User } from '../types';

export function Usuarios() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formFields: FieldDef[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'text', required: true },
    { name: 'password', label: 'Senha (mín. 6 caracteres)', type: 'password', required: true },
    {
      name: 'role', label: 'Perfil de acesso', type: 'select', required: true, defaultValue: 'OPERATOR',
      options: [
        { value: 'OPERATOR', label: 'Operador' },
        { value: 'ADMIN', label: 'Administrador' },
      ],
    },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await usersApi.list();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
    else setLoading(false);
  }, [isAdmin]);

  const handleCreate = async (form: any) => {
    await usersApi.create(form);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) {
      setError('Você não pode excluir o próprio usuário.');
      return;
    }
    if (!confirm(`Excluir o usuário "${u.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await usersApi.delete(u.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    }
  };

  // Somente administradores gerenciam usuários — os demais veem um aviso claro.
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto w-full">
        <div className="card p-8 text-center">
          <ShieldAlert size={40} className="mx-auto mb-3 text-warning" />
          <h1 className="text-lg font-semibold text-text-primary mb-1">Acesso restrito</h1>
          <p className="text-sm text-text-muted">
            A gestão de usuários está disponível apenas para administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <EntityPageLayout
        title="Usuários"
        description="Gerencie administradores e operadores do sistema"
        icon={<Users size={24} />}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadData}
        onAdd={() => setIsModalOpen(true)}
        actionButtonLabel="Novo Usuário"
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'email', label: 'E-mail' },
          { key: 'role', label: 'Perfil', align: 'center' },
          { key: 'created_at', label: 'Criado em' },
        ]}
        renderRow={(u) => (
          <tr key={u.id} className="hover:bg-card-hover group transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">
              {u.name}
              {u.id === currentUser?.id && (
                <span className="ml-2 px-1.5 py-0.5 bg-gold/15 text-gold rounded text-xs">você</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">{u.email}</td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                u.role === 'ADMIN' ? 'bg-gold/20 text-gold' : 'bg-border text-text-muted'
              }`}>
                {ROLE_LABELS[u.role] ?? u.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-text-muted">
              {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right sticky right-0 bg-card group-hover:bg-card-hover transition-colors">
              <button
                onClick={() => handleDelete(u)}
                disabled={u.id === currentUser?.id}
                className="p-1 rounded text-text-muted hover:text-negative transition-colors disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed"
                title={u.id === currentUser?.id ? 'Não é possível excluir o próprio usuário' : 'Excluir'}
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Usuário">
        <EntityForm fields={formFields} onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}
