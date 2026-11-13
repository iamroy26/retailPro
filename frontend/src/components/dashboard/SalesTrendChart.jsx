import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lifted">
      <p className="text-xs font-medium">{label}</p>
      <p className="tnum mt-0.5 text-sm font-semibold">{formatCurrency(point.total, currency)}</p>
      <p className="text-[11px] text-muted-foreground">
        {point.transactions} transaction{point.transactions === 1 ? '' : 's'}
      </p>
    </div>
  );
}

export default function SalesTrendChart({ data = [], currency = 'GHS' }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => formatCompactCurrency(value, currency)}
          />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: 'hsl(var(--border))' }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#salesTrendFill)"
            dot={{ r: 3, strokeWidth: 2, fill: 'hsl(var(--card))', stroke: 'hsl(var(--chart-1))' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}