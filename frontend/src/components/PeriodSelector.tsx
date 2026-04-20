import { PERIOD_OPTIONS, useSettings } from '@/contexts/SettingsContext';

export function PeriodSelector() {
  const { days, setDays } = useSettings();
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.days}
          onClick={() => setDays(opt.days)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            days === opt.days
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
