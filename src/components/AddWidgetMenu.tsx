import { useState, useRef, useEffect } from "react";
import { useStore, type WidgetType } from "@/lib/store";
import { WIDGET_META } from "./widgets";
import { Plus, RotateCcw } from "lucide-react";

export function AddWidgetMenu() {
  const addWidget = useStore((s) => s.addWidget);
  const resetDashboard = useStore((s) => s.resetDashboard);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const groups = Object.entries(WIDGET_META).reduce<Record<string, [string, { title: string; group: string }][]>>((acc, entry) => {
    const g = entry[1].group;
    (acc[g] ||= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <button
        onClick={() => resetDashboard()}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        title="Reset to default layout"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" /> Add Widget
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          <div className="max-h-96 overflow-auto p-2">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-2">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
                {items.map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => { addWidget(key as WidgetType); setOpen(false); }}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs text-popover-foreground transition-colors hover:bg-accent"
                  >
                    {meta.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
