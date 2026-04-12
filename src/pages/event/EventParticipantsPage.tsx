import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import * as participantsService from '@/services/participantsService';
import * as salesService from '@/services/salesService';
import type { EventSummary, Participant } from '@/types/api';
import { ApiRequestError } from '@/services/apiError';
import { parseSaleSerialNumbersInput } from '@/utils/serialNumbers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function EventParticipantsPage() {
  const { event } = useEventWorkspace();
  const navigate = useNavigate();
  const base = `/events/${event.id}`;

  const [items, setItems] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Na maioria dos casos a pessoa compra a cartela antes de constar no sistema. */
  const [registerSale, setRegisterSale] = useState(true);
  const [saleQuantity, setSaleQuantity] = useState('1');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>(
    'unpaid',
  );
  const [saleUnitPrice, setSaleUnitPrice] = useState('');
  const [saleCurrency, setSaleCurrency] = useState('BRL');
  const [saleNotes, setSaleNotes] = useState('');
  const [saleSerialsRaw, setSaleSerialsRaw] = useState('');

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [edit, setEdit] = useState<Participant | null>(null);
  const [eName, setEName] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eNotes, setENotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await participantsService.listParticipants(event.id, {
        page: 1,
        page_size: 100,
      });
      setItems(res.items);
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Não foi possível carregar os participantes.',
      );
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (event.default_unit_price_cents != null) {
      setSaleUnitPrice((event.default_unit_price_cents / 100).toFixed(2));
    } else {
      setSaleUnitPrice('');
    }
    setSaleCurrency(event.default_currency || 'BRL');
  }, [event.default_unit_price_cents, event.default_currency, event.id]);

  function resetSaleFieldsFromEvent(ev: EventSummary) {
    if (ev.default_unit_price_cents != null) {
      setSaleUnitPrice((ev.default_unit_price_cents / 100).toFixed(2));
    } else {
      setSaleUnitPrice('');
    }
    setSaleCurrency(ev.default_currency || 'BRL');
    setSaleSerialsRaw('');
  }

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      return;
    }

    const qty = Number.parseInt(saleQuantity, 10);
    if (registerSale && (!Number.isFinite(qty) || qty < 1)) {
      window.alert('Informe uma quantidade válida de cartelas para a venda.');
      return;
    }

    let unitCents: number | null = null;
    if (registerSale) {
      if (saleUnitPrice.trim() !== '') {
        const n = Number.parseFloat(saleUnitPrice.replace(',', '.'));
        if (!Number.isFinite(n) || n < 0) {
          window.alert('Preço unitário inválido.');
          return;
        }
        unitCents = Math.round(n * 100);
      } else if (event.default_unit_price_cents != null) {
        unitCents = event.default_unit_price_cents;
      }
    }

    let parsedSerials:
      | { ok: true; serial_numbers: number[] | undefined }
      | { ok: false; message: string } = {
      ok: true,
      serial_numbers: undefined,
    };
    if (registerSale && qty >= 1) {
      parsedSerials = parseSaleSerialNumbersInput(saleSerialsRaw, qty);
      if (!parsedSerials.ok) {
        window.alert(parsedSerials.message);
        return;
      }
    }

    setSaving(true);
    try {
      const created = await participantsService.createParticipant(event.id, {
        display_name: displayName.trim(),
        email: email.trim() === '' ? null : email.trim(),
        phone: phone.trim() === '' ? null : phone.trim(),
        notes: notes.trim() === '' ? null : notes,
      });

      if (registerSale && qty >= 1) {
        try {
          const saleBody: Parameters<typeof salesService.createSale>[1] = {
            participant_id: created.id,
            quantity: qty,
            payment_status: paymentStatus,
            unit_price_cents: unitCents,
            currency: saleCurrency.trim() || 'BRL',
            notes: saleNotes.trim() === '' ? null : saleNotes,
          };
          if (parsedSerials.ok && parsedSerials.serial_numbers) {
            saleBody.serial_numbers = parsedSerials.serial_numbers;
          }
          const sale = await salesService.createSale(event.id, saleBody);
          setDisplayName('');
          setEmail('');
          setPhone('');
          setNotes('');
          setSaleQuantity('1');
          setPaymentStatus('unpaid');
          resetSaleFieldsFromEvent(event);
          setSaleNotes('');
          await load();
          navigate(`${base}/sales/${sale.id}`, { replace: false });
          return;
        } catch (saleErr) {
          const msg =
            saleErr instanceof ApiRequestError
              ? saleErr.message
              : 'Erro desconhecido';
          window.alert(
            `Participante cadastrado, mas a venda não pôde ser registrada: ${msg}. Você pode registrar a venda em Vendas.`,
          );
        }
      }

      setDisplayName('');
      setEmail('');
      setPhone('');
      setNotes('');
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível salvar o participante.',
      );
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: Participant) {
    setEdit(p);
    setEName(p.display_name);
    setEEmail(p.email ?? '');
    setEPhone(p.phone ?? '');
    setENotes(p.notes ?? '');
    dialogRef.current?.showModal();
  }

  function closeEdit() {
    dialogRef.current?.close();
    setEdit(null);
  }

  async function saveEdit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!edit || !eName.trim()) {
      return;
    }
    setSaving(true);
    try {
      await participantsService.updateParticipant(edit.id, {
        display_name: eName.trim(),
        email: eEmail.trim() === '' ? null : eEmail.trim(),
        phone: ePhone.trim() === '' ? null : ePhone.trim(),
        notes: eNotes.trim() === '' ? null : eNotes,
      });
      closeEdit();
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível atualizar.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Participant) {
    if (!window.confirm(`Remover ${p.display_name}?`)) {
      return;
    }
    try {
      await participantsService.deleteParticipant(p.id);
      await load();
    } catch (err) {
      window.alert(
        err instanceof ApiRequestError
          ? err.message
          : 'Não foi possível excluir.',
      );
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Participantes"
        description="Cadastre quem compra cartelas. Você pode registrar a venda no mesmo passo — é o fluxo mais comum após a compra."
      />

      {error ? (
        <Callout tone="error" title="Erro">
          {error}
        </Callout>
      ) : null}

      <form className="form-stack" onSubmit={addOne}>
        <h2 className="section-heading">Novo participante</h2>
        <TextField
          label="Nome de exibição"
          value={displayName}
          onChange={(ev) => setDisplayName(ev.target.value)}
        />
        <TextField
          label="E-mail (opcional)"
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <TextField
          label="Telefone (opcional)"
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
        />
        <TextAreaField
          label="Observações do participante (opcional)"
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          rows={2}
        />

        <fieldset className="fieldset-sale">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={registerSale}
              onChange={(ev) => setRegisterSale(ev.target.checked)}
            />
            <span>Registrar venda neste cadastro</span>
          </label>
          <p className="fieldset-sale__hint">
            Marque para já vincular cartelas e pagamento ao criar a pessoa. Se
            desmarcar, cadastre só o participante e registre a venda depois em{' '}
            <Link to={`${base}/sales`}>Vendas</Link>.
          </p>

          {registerSale ? (
            <>
              <TextField
                label="Quantidade de cartelas"
                type="number"
                min={1}
                value={saleQuantity}
                onChange={(ev) => setSaleQuantity(ev.target.value)}
              />
              <TextField
                label="Números das cartelas (opcional)"
                value={saleSerialsRaw}
                onChange={(ev) => setSaleSerialsRaw(ev.target.value)}
                hint="Um número por cartela (mesma ordem da quantidade). Ex.: 12 ou 3, 8, 15. Vazio = o sistema escolhe cartelas disponíveis."
                autoComplete="off"
              />
              <SelectField
                label="Situação do pagamento"
                value={paymentStatus}
                onChange={(ev) =>
                  setPaymentStatus(ev.target.value as 'paid' | 'unpaid')
                }
                options={[
                  { value: 'unpaid', label: 'Não pago' },
                  { value: 'paid', label: 'Pago' },
                ]}
              />
              <TextField
                label="Preço unitário (opcional, em reais)"
                value={saleUnitPrice}
                onChange={(ev) => setSaleUnitPrice(ev.target.value)}
                hint="Somente registro; o sistema não processa pagamento."
              />
              <TextField
                label="Moeda (código ISO)"
                value={saleCurrency}
                onChange={(ev) => setSaleCurrency(ev.target.value.toUpperCase())}
                maxLength={3}
              />
              <TextAreaField
                label="Observações da venda (opcional)"
                value={saleNotes}
                onChange={(ev) => setSaleNotes(ev.target.value)}
                rows={2}
              />
            </>
          ) : null}
        </fieldset>

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={!displayName.trim()}
          >
            {registerSale ? 'Salvar participante e venda' : 'Salvar participante'}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="table-skeleton" aria-busy>
          <div className="table-skeleton__row" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state__title">Nenhum participante</h2>
          <p className="empty-state__text">
            Use o formulário acima para incluir pessoas e, se quiser, já a venda
            das cartelas.
          </p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <>
          <h2 className="section-heading">Lista</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Contato</th>
                  <th scope="col">Observações</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.display_name}</td>
                    <td className="muted-cell">
                      {[p.email, p.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="muted-cell">{p.notes ?? '—'}</td>
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
        </>
      ) : null}

      <dialog ref={dialogRef} className="modal-dialog" onClose={() => setEdit(null)}>
        <form className="modal-dialog__inner" onSubmit={saveEdit}>
          <h2 className="modal-dialog__title">Editar participante</h2>
          <TextField
            label="Nome de exibição"
            value={eName}
            onChange={(ev) => setEName(ev.target.value)}
          />
          <TextField
            label="E-mail"
            type="email"
            value={eEmail}
            onChange={(ev) => setEEmail(ev.target.value)}
          />
          <TextField
            label="Telefone"
            value={ePhone}
            onChange={(ev) => setEPhone(ev.target.value)}
          />
          <TextAreaField
            label="Observações"
            value={eNotes}
            onChange={(ev) => setENotes(ev.target.value)}
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
