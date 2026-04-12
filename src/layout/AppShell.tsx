import { branding } from '@/constants/branding';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Link, NavLink, Outlet } from 'react-router-dom';

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <Link to="/events" className="app-shell__logo">
            <img
              src={branding.logoWordmark}
              alt={branding.appName}
              className="app-shell__logo-img"
              decoding="async"
            />
          </Link>
          <span className="app-shell__tag">
            {user?.role === 'admin'
              ? 'Administrador'
              : user?.role === 'seller'
                ? 'Vendedor'
                : 'Organizador'}
          </span>
        </div>
        <nav className="app-shell__nav" aria-label="Principal">
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `app-shell__nav-link ${isActive ? 'is-active' : ''}`.trim()
            }
            end
          >
            Eventos
          </NavLink>
        </nav>
        <div className="app-shell__user">
          <span className="app-shell__email" title={user?.email}>
            {user?.email ?? '—'}
          </span>
          <Button type="button" variant="ghost" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </header>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
