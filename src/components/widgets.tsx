import { useStore } from "@/lib/store";
import { fmtCurrency, fmtPct, kpis, exposureBy, enrichedHoldings, performanceTrend, capGainsSummary, bankBalances, tradeActivity } from "@/lib/selectors";
import type { WidgetType } from "@/lib/store";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { useMemo } from "react";

const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)",
  "var(--chart-5)", "var(--chart-6)", "var(--chart-7)", "var(--chart-8)",
];

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function EmptyState({ msg = "No data" }: { msg?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
      {msg}
    </div>
  );
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "pos" | "neg" | "neutral" }) {
  const color =
    tone === "pos" ? "text-[var(--positive)]" :
    tone === "neg" ? "text-[var(--negative)]" : "text-foreground";
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ChartWrap({ children }: { children: React.ReactNode }) {
  return <div className="h-full w-full p-3">{children}</div>;
}

function useCtx() {
  const wb = useStore((s) => s.workbook);
  const customer = useStore((s) => s.selectedCustomer);
  return wb && customer ? { wb, customer } : null;
}

const ExposurePie = ({ field, title }: { field: any; title: string }) => {
  const ctx = useCtx();
  const data = useMemo(() => (ctx ? exposureBy(ctx, field, 8) : []), [ctx, field]);
  if (!ctx || !data.length) return <EmptyState />;
  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="85%" paddingAngle={1}>
            {data.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--card)" />))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: any, _n: any, p: any) => [`${fmtCurrency(v)} (${p.payload.pct.toFixed(1)}%)`, p.payload.name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
};

const ExposureBar = ({ field }: { field: any }) => {
  const ctx = useCtx();
  const data = useMemo(() => (ctx ? exposureBy(ctx, field, 12) : []), [ctx, field]);
  if (!ctx || !data.length) return <EmptyState />;
  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => fmtCurrency(v)} stroke="var(--muted-foreground)" fontSize={10} />
          <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={10} width={110} interval={0} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCurrency(v)} cursor={{ fill: "var(--accent)", opacity: 0.3 }} />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
};

function HoldingsTable() {
  const ctx = useCtx();
  const rows = useMemo(() => (ctx ? enrichedHoldings(ctx) : []), [ctx]);
  if (!ctx || !rows.length) return <EmptyState />;
  const sorted = [...rows].sort((a, b) => b.marketValue - a.marketValue);
  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium">Security</th>
            <th className="px-3 py-2 text-left font-medium">Sector</th>
            <th className="px-3 py-2 text-left font-medium">Asset</th>
            <th className="px-3 py-2 text-right font-medium">Qty</th>
            <th className="px-3 py-2 text-right font-medium">Market Value</th>
            <th className="px-3 py-2 text-right font-medium">Cost</th>
            <th className="px-3 py-2 text-right font-medium">Unreal. P&L</th>
            <th className="px-3 py-2 text-right font-medium">Return</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {sorted.map((r, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-accent/30">
              <td className="px-3 py-1.5 max-w-[240px] truncate" title={r.securityName}>{r.securityName}</td>
              <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[140px]">{r.sector}</td>
              <td className="px-3 py-1.5 text-muted-foreground">{r.assetClass}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.quantity.toLocaleString()}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{fmtCurrency(r.marketValue)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{fmtCurrency(r.acquisitionCost)}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${r.unrealizedPL >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{fmtCurrency(r.unrealizedPL)}</td>
              <td className={`px-3 py-1.5 text-right tabular-nums ${r.returnPct >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{fmtPct(r.returnPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopMovers({ losers = false }: { losers?: boolean }) {
  const ctx = useCtx();
  const rows = useMemo(() => {
    if (!ctx) return [];
    const all = enrichedHoldings(ctx);
    return [...all].sort((a, b) => losers ? a.unrealizedPL - b.unrealizedPL : b.unrealizedPL - a.unrealizedPL).slice(0, 7);
  }, [ctx, losers]);
  if (!rows.length) return <EmptyState />;
  return (
    <div className="h-full w-full overflow-auto p-3">
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3 rounded border border-border/60 bg-background/40 p-2 text-xs">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium" title={r.securityName}>{r.securityName}</div>
              <div className="truncate text-[10px] text-muted-foreground">{r.sector}</div>
            </div>
            <div className="text-right tabular-nums">
              <div className={r.unrealizedPL >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>{fmtCurrency(r.unrealizedPL)}</div>
              <div className="text-[10px] text-muted-foreground">{fmtPct(r.returnPct)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CapGains() {
  const ctx = useCtx();
  const data = useMemo(() => (ctx ? capGainsSummary(ctx) : null), [ctx]);
  if (!data || (!data.byCategory.length && data.total === 0)) return <EmptyState />;
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded border border-border bg-background/40 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Short Term</div>
          <div className={`tabular-nums ${data.stgl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{fmtCurrency(data.stgl)}</div>
        </div>
        <div className="rounded border border-border bg-background/40 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Long Term</div>
          <div className={`tabular-nums ${data.ltgl >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{fmtCurrency(data.ltgl)}</div>
        </div>
        <div className="rounded border border-border bg-background/40 p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Total</div>
          <div className={`tabular-nums ${data.total >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{fmtCurrency(data.total)}</div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byCategory}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
            <YAxis tickFormatter={(v) => fmtCurrency(v)} stroke="var(--muted-foreground)" fontSize={10} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="shortTerm" name="Short Term" fill="var(--chart-2)" />
            <Bar dataKey="longTerm" name="Long Term" fill="var(--chart-3)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BankList() {
  const ctx = useCtx();
  const rows = useMemo(() => (ctx ? bankBalances(ctx) : []), [ctx]);
  if (!rows.length) return <EmptyState />;
  return (
    <div className="h-full w-full overflow-auto p-3">
      <ul className="space-y-2">
        {rows.map((b, i) => (
          <li key={i} className="flex items-center justify-between rounded border border-border/60 bg-background/40 p-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">{b.bank}</span>
              {b.isDefault && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] uppercase text-primary">Default</span>}
            </div>
            <span className="tabular-nums">{fmtCurrency(b.balance)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PerfTrend() {
  const ctx = useCtx();
  const data = useMemo(() => (ctx ? performanceTrend(ctx) : []), [ctx]);
  if (!data.length) return <EmptyState />;
  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="mvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={10} />
          <YAxis tickFormatter={(v) => fmtCurrency(v)} stroke="var(--muted-foreground)" fontSize={10} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCurrency(v)} />
          <Area type="monotone" dataKey="marketValue" name="Market Value" stroke="var(--chart-1)" fill="url(#mvFill)" strokeWidth={2} />
          <Line type="monotone" dataKey="cost" name="Cost" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
}

function TradeAct() {
  const ctx = useCtx();
  const data = useMemo(() => (ctx ? tradeActivity(ctx) : []), [ctx]);
  if (!data.length) return <EmptyState />;
  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} />
          <YAxis tickFormatter={(v) => fmtCurrency(v)} stroke="var(--muted-foreground)" fontSize={10} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtCurrency(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="buy" name="Buy" fill="var(--chart-3)" stackId="a" />
          <Bar dataKey="sell" name="Sell" fill="var(--chart-7)" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
}

function KpiWidget({ type }: { type: WidgetType }) {
  const ctx = useCtx();
  const data = useMemo(() => (ctx ? kpis(ctx) : null), [ctx]);
  if (!data) return <EmptyState />;
  switch (type) {
    case "kpi_market_value":
      return <KpiCard label="Total Market Value" value={fmtCurrency(data.marketValue)} sub={`Cost: ${fmtCurrency(data.cost)}`} />;
    case "kpi_unrealized_pl": {
      const pct = data.cost ? (data.unrealized / data.cost) * 100 : 0;
      return <KpiCard label="Unrealized P&L" value={fmtCurrency(data.unrealized)} sub={fmtPct(pct)} tone={data.unrealized >= 0 ? "pos" : "neg"} />;
    }
    case "kpi_realized_pl":
      return <KpiCard label="Realized P&L" value={fmtCurrency(data.realized)} tone={data.realized >= 0 ? "pos" : "neg"} />;
    case "kpi_bank_balance":
      return <KpiCard label="Bank Balance" value={fmtCurrency(data.bank)} />;
    default:
      return null;
  }
}

export const WIDGET_META: Record<WidgetType, { title: string; group: string }> = {
  kpi_market_value: { title: "Market Value", group: "KPI" },
  kpi_unrealized_pl: { title: "Unrealized P&L", group: "KPI" },
  kpi_realized_pl: { title: "Realized P&L", group: "KPI" },
  kpi_bank_balance: { title: "Bank Balance", group: "KPI" },
  asset_allocation: { title: "Asset Allocation", group: "Exposure" },
  sector_exposure: { title: "Sector Exposure", group: "Exposure" },
  issuer_exposure: { title: "Issuer Exposure", group: "Exposure" },
  security_exposure: { title: "Security Concentration", group: "Exposure" },
  rating_exposure: { title: "Rating Mix", group: "Exposure" },
  marketcap_exposure: { title: "Market Cap Mix", group: "Exposure" },
  holdings_table: { title: "Holdings", group: "Tables" },
  top_gainers: { title: "Top Gainers", group: "Performance" },
  top_losers: { title: "Top Losers", group: "Performance" },
  cap_gains_summary: { title: "Capital Gains", group: "Performance" },
  bank_balances: { title: "Bank Balances", group: "Tables" },
  performance_trend: { title: "Portfolio Trend", group: "Performance" },
  trade_activity: { title: "Trade Activity", group: "Activity" },
};

export function WidgetBody({ type }: { type: WidgetType }) {
  switch (type) {
    case "kpi_market_value":
    case "kpi_unrealized_pl":
    case "kpi_realized_pl":
    case "kpi_bank_balance":
      return <KpiWidget type={type} />;
    case "asset_allocation": return <ExposurePie field="assetClass" title="Asset" />;
    case "sector_exposure": return <ExposureBar field="sector" />;
    case "issuer_exposure": return <ExposureBar field="issuer" />;
    case "security_exposure": return <ExposureBar field="securityName" />;
    case "rating_exposure": return <ExposurePie field="rating" title="Rating" />;
    case "marketcap_exposure": return <ExposurePie field="marketCap" title="Market Cap" />;
    case "holdings_table": return <HoldingsTable />;
    case "top_gainers": return <TopMovers />;
    case "top_losers": return <TopMovers losers />;
    case "cap_gains_summary": return <CapGains />;
    case "bank_balances": return <BankList />;
    case "performance_trend": return <PerfTrend />;
    case "trade_activity": return <TradeAct />;
    default: return <EmptyState />;
  }
}
