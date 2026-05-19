import { useRef, useEffect, useState } from "react";
import { GridLayout, useContainerWidth, type LayoutItem } from "react-grid-layout";
import { useStore } from "@/lib/store";
import { WidgetBody, WIDGET_META } from "./widgets";
import { X, GripVertical } from "lucide-react";

export function DashboardGrid() {
  const widgets = useStore((s) => s.widgets);
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);
  const removeWidget = useStore((s) => s.removeWidget);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!widgets.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No widgets. Click "Add Widget" to start.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: 12, rowHeight: 56, margin: [12, 12] }}
          onLayoutChange={(l) => setLayout(l as unknown as LayoutItem[])}
          dragConfig={{ handle: ".widget-drag-handle" }}
        >
          {widgets.map((w) => (
            <div key={w.id} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex h-9 items-center justify-between border-b border-border/70 bg-card/60 px-2">
                <div className="widget-drag-handle flex flex-1 cursor-grab items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground active:cursor-grabbing">
                  <GripVertical className="h-3.5 w-3.5 opacity-50" />
                  <span className="truncate">{WIDGET_META[w.type].title}</span>
                </div>
                <button
                  onClick={() => removeWidget(w.id)}
                  className="ml-1 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                  aria-label="Remove widget"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="h-[calc(100%-2.25rem)]">
                <WidgetBody type={w.type} />
              </div>
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}

// suppress unused import lint
void useContainerWidth;
