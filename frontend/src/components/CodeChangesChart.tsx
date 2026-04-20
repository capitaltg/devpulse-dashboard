import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CodeChangePoint {
  date: string;
  commit_count: number;
  total_additions: number;
  total_deletions: number;
  total_changes: number;
  unique_authors: number;
}

interface CodeChangesChartProps {
  data: CodeChangePoint[];
  title?: string;
}

export function CodeChangesChart({ data, title = 'Code Changes (30d)' }: CodeChangesChartProps) {
  const totals = useMemo(() => {
    const additions = data.reduce((s, p) => s + p.total_additions, 0);
    const deletions = data.reduce((s, p) => s + p.total_deletions, 0);
    const commits = data.reduce((s, p) => s + p.commit_count, 0);
    return { additions, deletions, commits };
  }, [data]);

  const chartData = useMemo(
    () =>
      data.map((p) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Additions: p.total_additions,
        Deletions: p.total_deletions,
      })),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="dashboard-section">
        <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
        <p className="text-sm text-muted-foreground">No code changes in the last 30 days.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{totals.commits.toLocaleString()} commits</span>
          <span className="text-dashboard-success">+{totals.additions.toLocaleString()}</span>
          <span className="text-dashboard-danger">−{totals.deletions.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            <Area
              type="monotone"
              dataKey="Additions"
              stroke="hsl(142, 71%, 45%)"
              fill="hsl(142, 71%, 45%)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Deletions"
              stroke="hsl(0, 84%, 60%)"
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
