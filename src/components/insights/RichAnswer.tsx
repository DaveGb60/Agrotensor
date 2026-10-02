import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2, 200 70% 45%))', 'hsl(var(--chart-3, 35 85% 50%))', 'hsl(var(--chart-4, 340 65% 50%))'];

interface ChartSpec {
  type: 'bar' | 'line' | 'area' | 'pie' | 'histogram';
  title?: string;
  xKey: string;
  series: { key: string; label?: string }[];
  data: Record<string, string | number>[];
}

function parseChart(src: string): ChartSpec | null {
  try {
    const c = JSON.parse(src);
    if (!c || !Array.isArray(c.data) || !c.xKey) return null;
    if (!Array.isArray(c.series) || !c.series.length) {
      const k = Object.keys(c.data[0] ?? {}).find((x) => x !== c.xKey && typeof c.data[0][x] === 'number');
      if (!k) return null;
      c.series = [{ key: k, label: k }];
    }
    c.data = c.data.slice(0, 60).map((d: Record<string, unknown>) => {
      const o: Record<string, string | number> = { [c.xKey]: String(d[c.xKey] ?? '') };
      for (const s of c.series) o[s.key] = Number(d[s.key]) || 0;
      return o;
    });
    return c as ChartSpec;
  } catch {
    return null;
  }
}

function Chart({ spec }: { spec: ChartSpec }) {
  const axis = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11 };
  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
      <XAxis dataKey={spec.xKey} {...axis} />
      <YAxis {...axis} width={48} />
      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
      {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
    </>
  );
  let el: JSX.Element;
  if (spec.type === 'pie') {
    const s = spec.series[0];
    el = (
      <PieChart>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Pie data={spec.data} dataKey={s.key} nameKey={spec.xKey} outerRadius={90} label>
          {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
      </PieChart>
    );
  } else if (spec.type === 'line') {
    el = <LineChart data={spec.data}>{common}{spec.series.map((s, i) => <Line key={s.key} dataKey={s.key} name={s.label ?? s.key} stroke={COLORS[i % 4]} strokeWidth={2} dot={false} />)}</LineChart>;
  } else if (spec.type === 'area') {
    el = <AreaChart data={spec.data}>{common}{spec.series.map((s, i) => <Area key={s.key} dataKey={s.key} name={s.label ?? s.key} stroke={COLORS[i % 4]} fill={COLORS[i % 4]} fillOpacity={0.2} />)}</AreaChart>;
  } else {
    el = (
      <BarChart data={spec.data} barCategoryGap={spec.type === 'histogram' ? 0 : '15%'}>
        {common}
        {spec.series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={COLORS[i % 4]} radius={spec.type === 'histogram' ? 0 : [4, 4, 0, 0]} />)}
      </BarChart>
    );
  }
  return (
    <figure className="my-3 rounded-lg border border-border bg-card p-3">
      {spec.title && <figcaption className="text-xs font-semibold mb-2">{spec.title}</figcaption>}
      <div className="h-64 w-full"><ResponsiveContainer>{el}</ResponsiveContainer></div>
    </figure>
  );
}

export function RichAnswer({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div className="text-sm leading-relaxed space-y-2 [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_h1,&_h2,&_h3]:font-semibold [&_h1,&_h2,&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: (p) => <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse" {...p} /></div>,
          th: (p) => <th className="border border-border bg-muted px-2 py-1 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-border px-2 py-1" {...p} />,
          a: (p) => <a className="text-primary underline" target="_blank" rel="noreferrer" {...p} />,
          code: ({ className, children, ...p }) => {
            const src = String(children ?? '');
            if (/language-chart/.test(className ?? '')) {
              const spec = parseChart(src);
              if (spec) return <Chart spec={spec} />;
              return streaming ? <span className="block h-64 my-3 rounded-lg bg-muted animate-pulse" /> : null;
            }
            return <code className="rounded bg-muted px-1 py-0.5 text-xs" {...p}>{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
