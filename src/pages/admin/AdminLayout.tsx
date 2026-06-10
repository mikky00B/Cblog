import { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileText, Image, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { clearAdminToken } from '../../lib/api';

export function AdminLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <header className="border-b border-outline-variant bg-background">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-sm flex items-center justify-between">
          <Link to="/admin" className="font-headline-sm text-primary">
            Admin
          </Link>
          <div className="flex items-center gap-stack-sm">
            <Link to="/" className="font-label-caps text-secondary hover:text-primary">
              View site
            </Link>
            <button onClick={handleLogout} className="p-2 border border-outline-variant rounded-sm" aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-gutter">
        <aside className="border-b lg:border-b-0 lg:border-r border-outline-variant pb-stack-md lg:pb-0">
          <nav className="flex lg:flex-col gap-2">
            <AdminNavLink to="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" />
            <AdminNavLink to="/admin/posts" icon={<FileText className="w-4 h-4" />} label="Posts" />
            <AdminNavLink to="/admin/media" icon={<Image className="w-4 h-4" />} label="Media" />
            <AdminNavLink to="/admin/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
          </nav>
        </aside>

        <main>{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

function AdminNavLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 border border-outline-variant rounded-sm font-label-caps ${
          isActive ? 'bg-primary text-on-primary border-primary' : 'text-secondary hover:text-primary'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
