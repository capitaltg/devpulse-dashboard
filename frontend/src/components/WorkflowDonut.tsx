import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useOrgPath } from '@/contexts/AppContext';

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface WorkflowDonutProps {
  data: DonutItem[];
  title?: string;
  showViewAll?: boolean;
}

export function WorkflowDonut({ data, title = 'Workflow Results', showViewAll = false }: WorkflowDonutProps) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const orgPath = useOrgPath();

  return (
    <div className="dashboard-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {showViewAll && (
          <Link to={orgPath('workflows')} className="text-sm text-primary hover:underline">View all →</Link>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} runs`, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-foreground font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">{item.value.toLocaleString()}</span>
                <span className="text-muted-foreground text-xs w-10 text-right">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
