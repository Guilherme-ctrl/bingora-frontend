import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Callout } from '@/components/ui/Callout';
import { AuthLayout } from '@/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { isMockApiMode } from '@/services/config';
import { ApiRequestError, userFacingApiMessage } from '@/services/apiError';
import { loginSchema } from '@/validation/authAndEvents';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export function LoginPage() {
  const mock = isMockApiMode();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl') || '/events';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      navigate(returnUrl.startsWith('/') ? returnUrl : '/events', {
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setFormError('E-mail ou senha inválidos.');
      } else if (err instanceof ApiRequestError) {
        setFormError(userFacingApiMessage(err));
      } else {
        setFormError(
          'Não foi possível entrar. Verifique a conexão e tente de novo.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-layout__title">Entrar</h1>
      <p className="auth-layout__subtitle">
        Acesse seus eventos e opere o bingo em um só lugar.
      </p>

      {formError ? (
        <Callout tone="error" title="Falha no login">
          {formError}
        </Callout>
      ) : null}

      <form className="auth-layout__form" onSubmit={onSubmit} noValidate>
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          label="E-mail"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          name="password"
          type="password"
          autoComplete="current-password"
          label="Senha"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          error={fieldErrors.password}
        />
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="auth-layout__submit"
        >
          Entrar
        </Button>
      </form>
      <p className="auth-layout__hint">
        Não tem conta? <Link to="/register">Criar conta</Link>
      </p>
      {mock ? (
        <p className="auth-layout__hint">
          Modo mock: use qualquer e-mail exceto <code>invalid@example.com</code>{' '}
          e senha com 8+ caracteres. Defina{' '}
          <code>VITE_USE_MOCK_API=false</code> para usar a API real (proxy de
          desenvolvimento).
        </p>
      ) : null}
    </AuthLayout>
  );
}
