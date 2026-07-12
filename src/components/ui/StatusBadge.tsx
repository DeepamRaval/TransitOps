const STATUS_STYLES: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'On Trip': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'In Shop': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Retired: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  'Off Duty': 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  Suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
