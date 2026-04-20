import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeeklyData {
  week: string;
  commits: number;
  prsOpened: number;
  prsMerged: number;
  workflowRuns: number;
}

interface ActivityBarChartProps {
  data: WeeklyData[];
  title?: string;
}

export function ActivityBarChart({ data, title = 'Weekly Activity' }: ActivityBarChartProps) {
  return (
    <div className="dashboard-section">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            <Bar dataKey="commits" name="Commits" fill="hsl(217, 91%, 60%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="prsOpened" name="PRs Opened" fill="hsl(275, 80%, 60%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="prsMerged" name="PRs Merged" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="workflowRuns" name="Workflow Runs" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
