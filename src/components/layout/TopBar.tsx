import { useAuth } from '../../contexts/AuthContext';

export function TopBar() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
      <div>
        <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role} Account</p>
        <p className="text-sm font-medium text-[var(--text)]">
          {user?.name || 'TransitOps'}
        </p>
      </div>
    </div>
  );
}
