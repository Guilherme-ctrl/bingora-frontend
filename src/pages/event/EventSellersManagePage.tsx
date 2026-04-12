import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { TextField } from '@/components/ui/TextField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as eventSellersService from '@/services/eventSellersService';
import type { EventSellerAssignment } from '@/services/eventSellersService';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useState } from 'react';

export function EventSellersManagePage() {
  const { event, reloadEvent } = useEventWorkspace();
  const [items, setItems] = useState<EventSellerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventSellersService.listEventSellers(event.id);
      setItems(res.items);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar os vendedores.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const em = email.trim().toLowerCase();
    if (!em || !em.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }
    setSaving(true);
    try {
      const body: { email: string; password?: string } = { email: em };
      if (password.trim().length >= 8) {
        body.password = password.trim();
      }
      const row = await eventSellersService.addEventSeller(event.id, body);
      setItems((prev) => [...prev, row].sort((a, b) => a.email.localeCompare(b.email)));
      setEmail('');
      setPassword('');
      void reloadEvent();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível adicionar o vendedor.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(sellerOrganizerId: string) {
    if (
      !window.confirm(
        'Remover este vendedor deste evento? A conta dele continua existindo.',
      )
    ) {
      return;
    }
    try {
      await eventSellersService.removeEventSeller(event.id, sellerOrganizerId);
      setItems((prev) => prev.filter((x) => x.seller_organizer_id !== sellerOrganizerId));
      void reloadEvent();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível remover.',
      );
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Vendedores"
        description="Quem você adicionar aqui só vê e opera vendas (e participantes) neste evento. Para conta nova, defina uma senha com pelo menos 8 caracteres."
      />

      {error ? (
        <Callout tone="error" title="Erro">
          {error}
        </Callout>
      ) : null}

      <form className="form-stack seller-team-form" onSubmit={onAdd}>
        <TextField
          label="E-mail do vendedor"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <TextField
          label="Senha (só para conta nova)"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          hint="Obrigatória se o e-mail ainda não existir no sistema."
        />
        {formError ? (
          <Callout tone="error" title="Não foi possível adicionar">
            {formError}
          </Callout>
        ) : null}
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving}>
            Adicionar vendedor
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="table-skeleton" aria-busy>
          <div className="table-skeleton__row" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="muted-p">Nenhum vendedor designado ainda.</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="table-wrap" style={{ marginTop: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">E-mail</th>
                <th scope="col">Desde</th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.seller_organizer_id}>
                  <td>{row.email}</td>
                  <td className="muted-cell">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="data-table__action">
                    <button
                      type="button"
                      className="table-link table-link--danger"
                      onClick={() => void onRemove(row.seller_organizer_id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </PageContainer>
  );
}
