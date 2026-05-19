import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutItem } from "react-grid-layout";
type LayoutArr = LayoutItem[];
import type { ParsedWorkbook } from "./parse-excel";

export type WidgetType =
  | "kpi_market_value"
  | "kpi_unrealized_pl"
  | "kpi_realized_pl"
  | "kpi_bank_balance"
  | "asset_allocation"
  | "sector_exposure"
  | "issuer_exposure"
  | "security_exposure"
  | "rating_exposure"
  | "marketcap_exposure"
  | "holdings_table"
  | "top_gainers"
  | "top_losers"
  | "cap_gains_summary"
  | "bank_balances"
  | "performance_trend"
  | "trade_activity";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  title?: string;
}

interface State {
  workbook: ParsedWorkbook | null;
  selectedCustomer: string | null;
  widgets: WidgetInstance[];
  layout: LayoutArr;
  setWorkbook: (wb: ParsedWorkbook | null) => void;
  setCustomer: (c: string | null) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  setLayout: (l: LayoutArr) => void;
  resetDashboard: () => void;
}

const defaultWidgets = (): { widgets: WidgetInstance[]; layout: LayoutArr } => {
  const items: { type: WidgetType; w: number; h: number; x: number; y: number }[] = [
    { type: "kpi_market_value", x: 0, y: 0, w: 3, h: 2 },
    { type: "kpi_unrealized_pl", x: 3, y: 0, w: 3, h: 2 },
    { type: "kpi_realized_pl", x: 6, y: 0, w: 3, h: 2 },
    { type: "kpi_bank_balance", x: 9, y: 0, w: 3, h: 2 },
    { type: "asset_allocation", x: 0, y: 2, w: 4, h: 6 },
    { type: "sector_exposure", x: 4, y: 2, w: 4, h: 6 },
    { type: "issuer_exposure", x: 8, y: 2, w: 4, h: 6 },
    { type: "holdings_table", x: 0, y: 8, w: 12, h: 8 },
  ];
  const widgets: WidgetInstance[] = items.map((it, i) => ({
    id: `w_${i}_${it.type}`,
    type: it.type,
  }));
  const layout: LayoutArr = items.map((it, i) => ({
    i: widgets[i].id,
    x: it.x,
    y: it.y,
    w: it.w,
    h: it.h,
    minW: 2,
    minH: 2,
  }));
  return { widgets, layout };
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const seed = defaultWidgets();
      return {
        workbook: null,
        selectedCustomer: null,
        widgets: seed.widgets,
        layout: seed.layout,
        setWorkbook: (wb) => {
          // pick first customer by default
          let firstCustomer: string | null = null;
          if (wb) {
            const ids = Array.from(
              new Set(
                (wb.Portfolio_info ?? []).map((r: any) => r?.CUSTOMER).filter(Boolean)
              )
            );
            firstCustomer = ids[0] ?? null;
          }
          set({ workbook: wb, selectedCustomer: firstCustomer });
        },
        setCustomer: (c) => set({ selectedCustomer: c }),
        addWidget: (type) => {
          const id = `w_${Date.now().toString(36)}_${type}`;
          const { widgets, layout } = get();
          const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
          set({
            widgets: [...widgets, { id, type }],
            layout: [
              ...layout,
              { i: id, x: 0, y: maxY, w: 4, h: 5, minW: 2, minH: 2 },
            ],
          });
        },
        removeWidget: (id) => {
          set({
            widgets: get().widgets.filter((w) => w.id !== id),
            layout: get().layout.filter((l) => l.i !== id),
          });
        },
        setLayout: (l) => set({ layout: l }),
        resetDashboard: () => {
          const s = defaultWidgets();
          set({ widgets: s.widgets, layout: s.layout });
        },
      };
    },
    {
      name: "dashboard-state-v1",
      partialize: (s) => ({
        widgets: s.widgets,
        layout: s.layout,
        selectedCustomer: s.selectedCustomer,
      }),
    }
  )
);
