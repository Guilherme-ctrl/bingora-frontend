import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Callout } from '@/components/ui/Callout';
import { AuthLayout } from '@/layout/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@/validation/authAndEvents';
import { ApiRequestError, userFacingApiMessage } from '@/services/apiError';
import { isMockApiMode } from '@/services/config';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const mock = isMockApiMode();

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
      await register(parsed.data.email, parsed.data.password);
      navigate('/events', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(userFacingApiMessage(err));
      } else {
        setFormError('Não foi possível criar a conta.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-layout__title">Criar conta de organizador</h1>
      <p className="auth-layout__subtitle">
        Use o mesmo acesso para operar seus eventos.
      </p>

      {formError ? (
        <Callout tone="error" title="Cadastro não concluído">
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
          autoComplete="new-password"
          label="Senha (mín. 8 caracteres)"
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
          Registrar
        </Button>
      </form>
      <p className="auth-layout__hint">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
      {mock ? (
        <p className="auth-layout__hint">
          No modo mock a sessão fica só no navegador; use a API real para conta
          persistida no servidor.
        </p>
      ) : null}
    </AuthLayout>
  );
}
