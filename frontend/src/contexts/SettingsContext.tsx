import { createContext, useContext, useState, type ReactNode } from 'react';

export const PERIOD_OPTIONS = [
  { label: '30d',  days: 30  },
  { label: '60d',  days: 60  },
  { label: '90d',  days: 90  },
  { label: '1yr',  days: 365 },
] as const;

export type PeriodDays = typeof PERIOD_OPTIONS[number]['days'];

const STORAGE_KEY = 'devpulse_settings';
const DEFAULTS = {
  days: 30 as PeriodDays,
};

function loadSettings(): typeof DEFAULTS {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const days = Number(parsed.days);
      return {
        days: PERIOD_OPTIONS.some(o => o.days === days) ? (days as PeriodDays) : DEFAULTS.days,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULTS };
}

interface SettingsContextValue {
  days: PeriodDays;
  setDays: (days: PeriodDays) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const loaded = loadSettings();
  const [days, setDaysState] = useState<PeriodDays>(loaded.days);

  const setDays = (d: PeriodDays) => {
    setDaysState(d);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ days: d })); } catch { /* ignore */ }
  };

  return (
    <SettingsContext.Provider value={{ days, setDays }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
