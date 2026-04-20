import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CycleTimeData {
  week: string;
  avgHours: number;
  medianHours: number;
}

interface PRCycleTimeChartProps {
  data: CycleTimeData[];
  title?: string;
}

export function PRCycleTimeChart({ data, title = 'PR Cycle Time' }: PRCycleTimeChartProps) {
  return (
    <div className="dashboard-section">
      <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
              unit="h"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
              }}
              formatter={(value: number, name: string) => [
                `${value}h`,
                name === 'avgHours' ? 'Average' : 'Median',
              ]}
            />
            <Legend
              formatter={(value: string) => (value === 'avgHours' ? 'Average' : 'Median')}
              wrapperStyle={{ fontSize: '0.75rem' }}
            />
            <Line
              type="monotone"
              dataKey="avgHours"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(217, 91%, 60%)' }}
            />
            <Line
              type="monotone"
              dataKey="medianHours"
              stroke="hsl(142, 71%, 45%)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(142, 71%, 45%)' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
