import type { ParsedWorkbook } from "./parse-excel";

const num = (v: any): number => {
  if (v === null || v === undefined || v === "[NULL]") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

const toDate = (v: any): Date | null => {
  if (!v || v === "[NULL]") return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export interface Ctx {
  wb: ParsedWorkbook;
  customer: string;
}

export const getCustomers = (wb: ParsedWorkbook) => {
  const map = new Map<string, string>();
  for (const r of wb.Portfolio_info ?? []) {
    if (!r?.CUSTOMER) continue;
    if (!map.has(r.CUSTOMER)) {
      const name =
        r.CUSTOMER_NAME && r.CUSTOMER_NAME !== "[NULL]"
          ? String(r.CUSTOMER).slice(0, 14)
          : String(r.CUSTOMER);
      map.set(r.CUSTOMER, name);
    }
  }
  return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
};

/** Latest holdings per (PORTFOLIO, SECURITY) for the customer. */
export const latestHoldings = ({ wb, customer }: Ctx) => {
  const rows = (wb.Holding_data ?? []).filter((r) => r?.CUSTOMER === customer);
  // group by portfolio+security, keep max REPORT_DATE
  const byKey = new Map<string, any>();
  for (const r of rows) {
    const k = `${r.PORTFOLIO}|${r.SECURITY}`;
    const d = toDate(r.REPORT_DATE)?.getTime() ?? 0;
    const existing = byKey.get(k);
    const existingD = existing ? toDate(existing.REPORT_DATE)?.getTime() ?? 0 : -1;
    if (!existing || d > existingD) byKey.set(k, r);
  }
  return Array.from(byKey.values()).filter((r) => num(r.QUANTITY) !== 0);
};

export const secInfoIndex = (wb: ParsedWorkbook) => {
  const idx = new Map<string, any>();
  for (const r of wb.Sec_info ?? []) {
    if (r?.SECURITY && !idx.has(r.SECURITY)) idx.set(r.SECURITY, r);
  }
  return idx;
};

export interface EnrichedHolding {
  security: string;
  securityName: string;
  sector: string;
  issuer: string;
  industry: string;
  assetClass: string;
  rating: string;
  marketCap: string;
  quantity: number;
  marketValue: number;
  acquisitionCost: number;
  unrealizedPL: number;
  realizedPL: number;
  returnPct: number;
  portfolio: string;
}

export const enrichedHoldings = (ctx: Ctx): EnrichedHolding[] => {
  const sec = secInfoIndex(ctx.wb);
  return latestHoldings(ctx).map((h) => {
    const s = sec.get(h.SECURITY) ?? {};
    const sName = (v: any, fb: string) =>
      v && v !== "[NULL]" ? String(v) : fb;
    return {
      security: String(h.SECURITY),
      securityName: sName(s.SECURITY_NAME, String(h.SECURITY)),
      sector: sName(s.SECTOR_NAME, "Unknown"),
      issuer: sName(s.ISSUER_NAME, "Unknown"),
      industry: sName(s.INDUSTRY_NAME, "Unknown"),
      assetClass: sName(s.ASSET_NAME ?? s.RPT_ASSET_CLASS, String(h.ASSET_CLASS ?? "Other")),
      rating: sName(s.RATING_NAME, "Unrated"),
      marketCap: sName(s.MARKET_CAP_TYPE, "N/A"),
      quantity: num(h.QUANTITY),
      marketValue: num(h.MARKET_VALUE_PCY),
      acquisitionCost: num(h.ACQU_COST_PCY),
      unrealizedPL: num(h.UNREL_GAIN_LOSS_PCY),
      realizedPL: num(h.REAL_GAIN_LOSS_PCY),
      returnPct: num(h.RETURN),
      portfolio: String(h.PORTFOLIO ?? ""),
    };
  });
};

export const kpis = (ctx: Ctx) => {
  const h = enrichedHoldings(ctx);
  const marketValue = h.reduce((a, x) => a + x.marketValue, 0);
  const cost = h.reduce((a, x) => a + x.acquisitionCost, 0);
  const unrealized = h.reduce((a, x) => a + x.unrealizedPL, 0);
  const realized = h.reduce((a, x) => a + x.realizedPL, 0);
  const bank = (ctx.wb.Bank_bal ?? [])
    .filter((r) => r?.CUSTOMER === ctx.customer)
    .reduce((a, x) => a + num(x.CLOSING_BALANCE), 0);
  return { marketValue, cost, unrealized, realized, bank };
};

export const exposureBy = (
  ctx: Ctx,
  key: keyof EnrichedHolding,
  limit = 10
) => {
  const h = enrichedHoldings(ctx);
  const total = h.reduce((a, x) => a + x.marketValue, 0) || 1;
  const map = new Map<string, number>();
  for (const r of h) {
    const k = String(r[key] ?? "Unknown");
    map.set(k, (map.get(k) ?? 0) + r.marketValue);
  }
  const arr = Array.from(map.entries())
    .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
  if (arr.length <= limit) return arr;
  const top = arr.slice(0, limit);
  const others = arr.slice(limit).reduce(
    (a, x) => ({
      name: "Others",
      value: a.value + x.value,
      pct: a.pct + x.pct,
    }),
    { name: "Others", value: 0, pct: 0 }
  );
  return [...top, others];
};

export const performanceTrend = (ctx: Ctx) => {
  const rows = (ctx.wb.Holding_data ?? []).filter(
    (r) => r?.CUSTOMER === ctx.customer
  );
  const byDate = new Map<string, { mv: number; cost: number }>();
  for (const r of rows) {
    const d = toDate(r.REPORT_DATE);
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key) ?? { mv: 0, cost: 0 };
    v.mv += num(r.MARKET_VALUE_PCY);
    v.cost += num(r.ACQU_COST_PCY);
    byDate.set(key, v);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      marketValue: v.mv,
      cost: v.cost,
      pnl: v.mv - v.cost,
    }));
};

export const capGainsSummary = (ctx: Ctx) => {
  const rows = (ctx.wb.Cap_gain_loss ?? []).filter(
    (r) => r?.CUSTOMER === ctx.customer
  );
  const stgl = rows.reduce((a, x) => a + num(x.STGL), 0);
  const ltgl = rows.reduce((a, x) => a + num(x.LTGL), 0);
  const byCat = new Map<string, { st: number; lt: number }>();
  for (const r of rows) {
    const k = String(r.SECURITY_CATEGORY_CAPGAINS ?? "OTHER");
    const v = byCat.get(k) ?? { st: 0, lt: 0 };
    v.st += num(r.STGL);
    v.lt += num(r.LTGL);
    byCat.set(k, v);
  }
  return {
    stgl,
    ltgl,
    total: stgl + ltgl,
    byCategory: Array.from(byCat.entries()).map(([name, v]) => ({
      name,
      shortTerm: v.st,
      longTerm: v.lt,
    })),
  };
};

export const bankBalances = (ctx: Ctx) =>
  (ctx.wb.Bank_bal ?? [])
    .filter((r) => r?.CUSTOMER === ctx.customer)
    .map((r) => ({
      bank: String(r.BANK_CODE ?? "—"),
      balance: num(r.CLOSING_BALANCE),
      isDefault: r.IS_DEFAULT === "Y",
    }));

export const tradeActivity = (ctx: Ctx) => {
  const rows = (ctx.wb.Trade_data ?? []).filter(
    (r) => r?.CUSTOMER === ctx.customer
  );
  const byMonth = new Map<string, { buy: number; sell: number }>();
  for (const r of rows) {
    const d = toDate(r.TRANS_DATE);
    if (!d) continue;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const v = byMonth.get(k) ?? { buy: 0, sell: 0 };
    const amt = Math.abs(num(r.NET_AMOUNT_PCY));
    if (String(r.TRANS_CODE).toUpperCase().includes("SELL")) v.sell += amt;
    else v.buy += amt;
    byMonth.set(k, v);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));
};

export const fmtCurrency = (n: number, currency = "INR") => {
  const abs = Math.abs(n);
  let val: string;
  if (abs >= 1e7) val = `${(n / 1e7).toFixed(2)} Cr`;
  else if (abs >= 1e5) val = `${(n / 1e5).toFixed(2)} L`;
  else if (abs >= 1e3) val = `${(n / 1e3).toFixed(1)} K`;
  else val = n.toFixed(0);
  return `${currency === "INR" ? "₹" : ""}${val}`;
};

export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
