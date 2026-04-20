import { commitActivity } from '@/data/mockData';

interface LanguageEntry {
  language: string;
  percentage: number;
  color: string;
}

export function LanguageBreakdown({ data }: { data: LanguageEntry[] }) {
  return (
    <div className="dashboard-section">
      <h2 className="text-lg font-semibold text-foreground mb-4">Language Distribution</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No language data available.</p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-4 rounded-full overflow-hidden mb-4">
            {data.map((lang) => (
              <div
                key={lang.language}
                className="transition-all duration-700"
                style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                title={`${lang.language}: ${lang.percentage}%`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.map((lang) => (
              <div key={lang.language} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lang.color }} />
                <span className="text-foreground font-medium">{lang.language}</span>
                <span className="text-muted-foreground">{lang.percentage}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function CommitChart() {
  const max = Math.max(...commitActivity.map((w) => w.commits));
  return (
    <div className="dashboard-section">
      <h2 className="text-lg font-semibold text-foreground mb-4">Commit Activity (5 weeks)</h2>
      <div className="flex items-end gap-3 h-32">
        {commitActivity.map((week) => (
          <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-foreground">{week.commits}</span>
            <div
              className="w-full bg-primary rounded-t-md transition-all duration-700"
              style={{ height: `${(week.commits / max) * 100}%` }}
            />
            <span className="text-xs text-muted-foreground">{week.week}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
