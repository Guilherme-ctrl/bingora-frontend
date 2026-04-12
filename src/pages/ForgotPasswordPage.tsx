import { AuthLayout } from '@/layout/AuthLayout';
import { Link } from 'react-router-dom';

/**
 * Placeholder até o fluxo de redefinição existir no backend (ver docs de rotas).
 */
export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <h1 className="auth-layout__title">Esqueci a senha</h1>
      <p className="auth-layout__subtitle">
        A redefinição automática por e-mail ainda não está disponível. Use o
        suporte do seu ambiente ou volte ao login se já tiver conta.
      </p>
      <p className="auth-layout__hint">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </AuthLayout>
  );
}
