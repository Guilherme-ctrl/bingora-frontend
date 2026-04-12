import { branding } from '@/constants/branding';
import { Link } from 'react-router-dom';

const valueBlocks = [
  {
    step: '1',
    title: 'Evento e prêmios',
    body: 'Cadastre o que será sorteado antes de gerar as cartelas — um fluxo só para o organizador.',
  },
  {
    step: '2',
    title: 'Cartelas únicas',
    body: 'Gere números únicos por evento, consulte a lista e exporte para imprimir (bingo 75 bolas, grade 5×5).',
  },
  {
    step: '3',
    title: 'Participantes e vendas',
    body: 'Registre quem comprou, quantas cartelas, e se pagou ou não — com correções quando a política do evento permitir.',
  },
  {
    step: '4',
    title: 'Sorteio e ganhadores',
    body: 'Chamadas numeradas em ordem e registro manual de ganhadores ligados a prêmio e cartela quando fizer sentido.',
  },
] as const;

function HeroPreview() {
  const gridCells = Array.from({ length: 25 }, (_, i) => i);
  const balls = [12, 24, 33, 41, 52, 64];

  return (
    <div className="marketing-preview">
      <div className="marketing-preview__chrome">
        <span className="marketing-preview__dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="marketing-preview__title">Bingora · Evento</span>
      </div>
      <div className="marketing-preview__body">
        <div className="marketing-preview__col">
          <p className="marketing-preview__label">Cartela (trecho)</p>
          <div className="marketing-preview__grid" aria-hidden>
            {gridCells.map((n) => (
              <span key={n} className="marketing-preview__cell" />
            ))}
          </div>
        </div>
        <div className="marketing-preview__col marketing-preview__col--draw">
          <p className="marketing-preview__label">Últimas chamadas</p>
          <ul className="marketing-preview__balls" aria-hidden>
            {balls.map((b) => (
              <li key={b} className="marketing-preview__ball">
                {b}
              </li>
            ))}
          </ul>
          <div className="marketing-preview__fake-row">
            <span className="marketing-preview__fake-pill">Pago</span>
            <span className="marketing-preview__fake-muted">2 cartelas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="marketing">
      <a href="#conteudo-principal" className="marketing__skip">
        Ir para o conteúdo principal
      </a>

      <header className="marketing-header">
        <div className="marketing-header__inner">
          <Link to="/" className="marketing-header__brand-block">
            <img
              src={branding.logoWordmark}
              alt={branding.appName}
              className="marketing-header__logo"
              decoding="async"
            />
            <span className="marketing-header__tagline">
              Para organizadores de evento presencial
            </span>
          </Link>
          <nav
            className="marketing-header__actions"
            aria-label="Conta e acesso"
          >
            <Link
              to="/register"
              className="marketing-header__link-register"
            >
              Criar conta
            </Link>
            <Link
              to="/login"
              className="btn btn--secondary marketing-header__btn"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo-principal" className="marketing-main">
        <section
          className="marketing-hero"
          aria-labelledby="marketing-hero-title"
        >
          <div className="marketing-hero__shell">
            <div className="marketing-hero__copy">
              <p className="marketing-hero__eyebrow">
                Uma aplicação web · Português (Brasil)
              </p>
              <h1 id="marketing-hero-title" className="marketing-hero__title">
                <span className="marketing-hero__brand">{branding.appName}</span>
                <span className="marketing-hero__headline">
                  Planeje o evento, venda com registro claro e conduza o sorteio
                  com histórico — em um só lugar.
                </span>
              </h1>
              <p className="marketing-hero__lead">
                Para quem organiza bingo beneficente ou comunitário presencial:
                menos anotações espalhadas, mais consistência entre cartelas
                emitidas, vendas anotadas e o que foi chamado ao vivo.
              </p>
              <div className="marketing-hero__ctas">
                <Link
                  to="/register"
                  className="btn btn--primary marketing-hero__cta-primary"
                >
                  Começar agora
                </Link>
                <Link
                  to="/login"
                  className="btn btn--secondary marketing-hero__cta-secondary"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
            <div className="marketing-hero__visual" aria-hidden="true">
              <HeroPreview />
            </div>
          </div>
        </section>

        <section
          className="marketing-value"
          aria-labelledby="marketing-value-title"
        >
          <div className="marketing-section-inner">
            <h2 id="marketing-value-title" className="marketing-section-title">
              O que você faz no Bingora
            </h2>
            <p className="marketing-value__intro">
              Pensado para um organizador por conta, com eventos independentes —
              do planejamento ao sorteio no mesmo fluxo.
            </p>
            <ul className="marketing-value-grid">
              {valueBlocks.map((block) => (
                <li key={block.step} className="marketing-value-card">
                  <span className="marketing-value-card__step" aria-hidden>
                    {block.step}
                  </span>
                  <h3 className="marketing-value-card__title">{block.title}</h3>
                  <p className="marketing-value-card__body">{block.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="marketing-trust"
          aria-labelledby="marketing-trust-title"
        >
          <div className="marketing-section-inner marketing-trust__inner">
            <h2 id="marketing-trust-title" className="marketing-section-title">
              Transparência operacional
            </h2>
            <p className="marketing-trust__text">
              O Bingora prioriza registro explícito: vendas e ganhadores são
              confirmados por você na interface — sem automação escondida para
              dinheiro ou resultado. Interface web responsiva; participantes não
              precisam de conta no sistema.
            </p>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <div className="marketing-footer__inner">
          <p className="marketing-footer__brand">{branding.appName}</p>
          <p className="marketing-footer__tagline">
            Operação de bingo para organizadores de comunidade
          </p>
          <p className="marketing-footer__links">
            <Link to="/login">Entrar</Link>
            <span aria-hidden className="marketing-footer__sep">
              ·
            </span>
            <Link to="/register">Criar conta</Link>
            <span aria-hidden className="marketing-footer__sep">
              ·
            </span>
            <Link to="/forgot-password">Esqueci a senha</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
