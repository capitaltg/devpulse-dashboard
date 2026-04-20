import { useMemo, type ReactNode } from 'react';

interface CommitHeatmapProps {
  data: number[];
  title?: string;
  totalOverride?: number;
  controls?: ReactNode;
}

const DAYS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];
const WEEKS = 52;
const CELL_SIZE = 11;
const GAP = 2;

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getColor(count: number): string {
  if (count === 0) return 'hsl(var(--muted))';
  if (count <= 2) return 'hsl(142, 71%, 80%)';
  if (count <= 5) return 'hsl(142, 71%, 60%)';
  if (count <= 8) return 'hsl(142, 71%, 45%)';
  return 'hsl(142, 71%, 32%)';
}

export function CommitHeatmap({ data, title = 'Commit Activity', totalOverride, controls }: CommitHeatmapProps) {
  const totalCommits = useMemo(() => data.reduce((a, b) => a + b, 0), [data]);
  const displayTotal = totalOverride ?? totalCommits;

  const weeks = useMemo(() => {
    const result: { count: number; date: string }[][] = [];
    const endDate = new Date();
    // Anchor to Saturday so each 7-day column is a full Sun->Sat week.
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (WEEKS * 7 - 1));

    for (let w = 0; w < WEEKS; w++) {
      const week: { count: number; date: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d;
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + idx);
        week.push({
          count: idx < data.length ? data[idx] : 0,
          date: toDateKey(cellDate),
        });
      }
      result.push(week);
    }
    return result;
  }, [data]);

  const months = useMemo(() => {
    const now = new Date();
    const labels: { label: string; col: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const weekOffset = Math.floor((i / 12) * WEEKS);
      labels.push({
        label: d.toLocaleString('default', { month: 'short' }),
        col: weekOffset,
      });
    }
    return labels;
  }, []);

  return (
    <div className="dashboard-section">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">{displayTotal.toLocaleString()} contributions</span>
      </div>
      <div className="flex items-start gap-6">
      <div className="overflow-x-auto flex-1">
        <div className="inline-flex flex-col gap-0.5" style={{ minWidth: WEEKS * (CELL_SIZE + GAP) + 30 }}>
          {/* Month labels */}
          <div className="flex ml-7">
            {months.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-muted-foreground"
                style={{
                  position: 'relative',
                  left: m.col * (CELL_SIZE + GAP),
                  width: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col justify-between pr-1" style={{ height: 7 * (CELL_SIZE + GAP) - GAP }}>
              {DAYS.map((day, i) => (
                <span key={i} className="text-[10px] text-muted-foreground leading-none" style={{ height: CELL_SIZE }}>
                  {day}
                </span>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((cell, di) => (
                    <div
                      key={di}
                      className="rounded-[2px] transition-colors"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: getColor(cell.count),
                      }}
                      title={`${cell.date}: ${cell.count} contributions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[10px] text-muted-foreground mr-1">Less</span>
            {[0, 1, 3, 6, 9].map((v) => (
              <div
                key={v}
                className="rounded-[2px]"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: getColor(v),
                }}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">More</span>
          </div>
        </div>
      </div>
        {controls && <div className="flex-shrink-0 pt-6">{controls}</div>}
      </div>
    </div>
  );
}
