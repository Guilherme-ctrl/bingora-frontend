import { Button } from '@/components/ui/Button';
import { PageContainer, PageHeader } from '@/components/ui/PageContainer';
import { useEventWorkspace } from '@/hooks/useEventWorkspace';
import { formatEventStartDisplay } from '@/utils/datetime';
import { Link } from 'react-router-dom';

export function EventOverviewPage() {
  const { event } = useEventWorkspace();
  const base = `/events/${event.id}`;

  const tiles = [
    { to: `${base}/prizes`, title: 'Prêmios', desc: 'Defina o que pode ser ganho.' },
    {
      to: `${base}/rodada`,
      title: 'Rodada',
      desc: 'Controle o estado operacional e checkpoints da mesa.',
    },
    {
      to: `${base}/cards`,
      title: 'Cartelas',
      desc: 'Gere cartelas únicas para impressão.',
    },
    {
      to: `${base}/participants`,
      title: 'Participantes',
      desc: 'Quem compra ou recebe cartelas.',
    },
    {
      to: `${base}/sales`,
      title: 'Vendas',
      desc: 'Atribua cartelas e acompanhe pagamento.',
    },
    {
      to: `${base}/finance`,
      title: 'Financeiro',
      desc: 'Arrecadação e totais por moeda.',
    },
    {
      to: `${base}/draw`,
      title: 'Sorteio',
      desc: 'Registre os números sorteados em ordem.',
    },
    {
      to: `${base}/winners`,
      title: 'Ganhadores',
      desc: 'Registre o resultado oficial por prêmio.',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Visão geral"
        description="Use as seções na ordem durante a preparação; depois rode o sorteio e declare os ganhadores."
      />

      <div className="summary-panel">
        <h2 className="summary-panel__title">Agenda</h2>
        <p className="summary-panel__text">
          {formatEventStartDisplay(event.starts_at, event.timezone)}
        </p>
        {event.venue_notes ? (
          <p className="summary-panel__text">
            <strong>Local / observações:</strong> {event.venue_notes}
          </p>
        ) : null}
        {event.default_unit_price_cents != null ? (
          <p className="summary-panel__text">
            <strong>Preço da cartela (referência):</strong>{' '}
            {(event.default_unit_price_cents / 100).toFixed(2)}{' '}
            {event.default_currency}
          </p>
        ) : null}
      </div>

      <ul className="shortcut-grid">
        {tiles.map((t) => (
          <li key={t.to} className="shortcut-tile">
            <Link to={t.to} className="shortcut-tile__link">
              <span className="shortcut-tile__title">{t.title}</span>
              <span className="shortcut-tile__desc">{t.desc}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="form-actions">
        <Link to={`${base}/draw`}>
          <Button type="button" variant="primary">
            Ir ao sorteio
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}
