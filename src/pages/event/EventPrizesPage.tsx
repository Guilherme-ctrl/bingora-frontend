import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as prizesService from '@/services/prizesService';
import type { Prize } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { useCallback, useEffect, useRef, useState } from 'react';

export function EventPrizesPage() {
  const { event } = useEventWorkspace();
  const [items, setItems] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [edit, setEdit] = useState<Prize | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSort, setEditSort] = useState('0');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prizesService.listPrizes(event.id);
      setItems(res.items);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar os prêmios.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPrize(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    setSaving(true);
    try {
      await prizesService.createPrize(event.id, {
        name: name.trim(),
        description: description.trim() === '' ? null : description,
        sort_order: Number.parseInt(sortOrder, 10) || 0,
      });
      setName('');
      setDescription('');
      setSortOrder('0');
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível adicionar o prêmio.',
      );
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: Prize) {
    setEdit(p);
    setEditName(p.name);
    setEditDesc(p.description ?? '');
    setEditSort(String(p.sort_order));
    dialogRef.current?.showModal();
  }

  function closeEdit() {
    dialogRef.current?.close();
    setEdit(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit || !editName.trim()) {
      return;
    }
    setSaving(true);
    try {
      await prizesService.updatePrize(edit.id, {
        name: editName.trim(),
        description: editDesc.trim() === '' ? null : editDesc,
        sort_order: Number.parseInt(editSort, 10) || 0,
      });
      closeEdit();
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível atualizar o prêmio.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Prize) {
    if (
      !window.confirm(
        `Excluir o prêmio “${p.name}”? Falha se já houver ganhador vinculado.`,
      )
    ) {
      return;
    }
    try {
      await prizesService.deletePrize(p.id);
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível excluir o prêmio.',
      );
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Prêmios"
        description="Ordene os prêmios para o anúncio; a ordem de exibição segue o campo de ordenação."
      />

      {error ? (
        <Callout tone="error" title="Erro">
          {error}
        </Callout>
      ) : null}

      <form className="form-stack" onSubmit={addPrize}>
        <TextField
          name="name"
          label="Nome"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
        <TextField
          name="sort_order"
          type="number"
          label="Ordem de exibição"
          value={sortOrder}
          onChange={(ev) => setSortOrder(ev.target.value)}
        />
        <TextAreaField
          name="description"
          label="Descrição (opcional)"
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          rows={2}
        />
        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={!name.trim()}
          >
            Adicionar prêmio
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="table-skeleton" aria-busy>
          <div className="table-skeleton__row" />
          <div className="table-skeleton__row" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state__title">Nenhum prêmio</h2>
          <p className="empty-state__text">
            Adicione pelo menos um prêmio antes de registrar ganhadores.
          </p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Ordem</th>
                <th scope="col">Nome</th>
                <th scope="col">Descrição</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.sort_order}</td>
                  <td>{p.name}</td>
                  <td className="muted-cell">{p.description ?? '—'}</td>
                  <td className="data-table__action">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => openEdit(p)}
                    >
                      Editar
                    </Button>{' '}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void remove(p)}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <dialog ref={dialogRef} className="modal-dialog" onClose={() => setEdit(null)}>
        <form className="modal-dialog__inner" onSubmit={saveEdit}>
          <h2 className="modal-dialog__title">Editar prêmio</h2>
          <TextField
            label="Nome"
            value={editName}
            onChange={(ev) => setEditName(ev.target.value)}
          />
          <TextField
            label="Ordem de exibição"
            type="number"
            value={editSort}
            onChange={(ev) => setEditSort(ev.target.value)}
          />
          <TextAreaField
            label="Descrição"
            value={editDesc}
            onChange={(ev) => setEditDesc(ev.target.value)}
            rows={3}
          />
          <div className="modal-dialog__actions">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </dialog>
    </PageContainer>
  );
}
