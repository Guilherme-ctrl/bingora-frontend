import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/ui/PageContainer';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <PageContainer>
      <div className="empty-state">
        <h1 className="empty-state__title">Página não encontrada</h1>
        <p className="empty-state__text">
          Este endereço não corresponde a uma tela do organizador. Confira o
          link ou volte aos eventos.
        </p>
        <Link to="/events">
          <Button type="button" variant="primary">
            Ir para eventos
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}
