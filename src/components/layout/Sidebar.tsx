import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarOff, BarChart3,
  Settings, LogOut, Building2, ChevronLeft, ChevronRight,
  ListTodo, Navigation, Wrench, DollarSign
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const menuLinks: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/profile', icon: Building2, label: 'Fleet' },
  { to: '/dashboard/workers', icon: Users, label: 'Drivers' },
  { to: '/dashboard/trips', icon: Navigation, label: 'Trips' },
  { to: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/dashboard/revenue', icon: DollarSign, label: 'Fuel & Expenses' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const role = user?.role;

  // Filter links dynamically based on the logged-in user's role
  let links = menuLinks;
  if (role === 'Driver') {
    links = menuLinks.filter(l => l.label === 'Trips');
  } else if (role === 'Safety Officer') {
    links = menuLinks.filter(l => l.label === 'Drivers');
  } else if (role === 'Financial Analyst') {
    links = menuLinks.filter(l => ['Dashboard', 'Fuel & Expenses', 'Analytics', 'Settings'].includes(l.label));
  } else if (role === 'Fleet Manager') {
    links = menuLinks.filter(l => ['Dashboard', 'Fleet', 'Drivers', 'Trips', 'Maintenance', 'Settings'].includes(l.label));
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 glass-card border-r border-[var(--border)] transition-all duration-300 flex flex-col ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm gradient-text">TransitOps</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'gradient-bg text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:bg-[var(--border)]/30 hover:text-[var(--text)]'
              }`
            }
          >
            <link.icon size={20} />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--border)]/30 transition-colors cursor-pointer">
          <span className="text-lg">{theme === 'light' ? '🌙' : '☀️'}</span>
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
