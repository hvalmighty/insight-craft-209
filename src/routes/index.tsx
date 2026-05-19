import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { FileDrop } from "@/components/FileDrop";
import { CustomerSelector } from "@/components/CustomerSelector";
import { AddWidgetMenu } from "@/components/AddWidgetMenu";
import { DashboardGrid } from "@/components/DashboardGrid";
import { LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Portfolio Analytics Dashboard" },
      { name: "description", content: "Customizable drag-and-drop dashboard for customer portfolio analytics: holdings, performance, exposure by sector, issuer & security." },
    ],
  }),
});

function Index() {
  const wb = useStore((s) => s.workbook);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">Portfolio Analytics</h1>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Drag · Resize · Customize</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wb && <CustomerSelector />}
            {wb && <FileDrop compact />}
            {wb && <AddWidgetMenu />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {!wb ? (
          <div className="mx-auto max-w-2xl py-12">
            <FileDrop />
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Data is parsed entirely in your browser. Nothing is uploaded.
            </p>
          </div>
        ) : (
          <DashboardGrid />
        )}
      </main>
    </div>
  );
}
