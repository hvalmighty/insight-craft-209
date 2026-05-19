import { useCallback, useState } from "react";
import { useStore } from "@/lib/store";
import { parseWorkbook } from "@/lib/parse-excel";
import { Upload, Loader2 } from "lucide-react";

export function FileDrop({ compact = false }: { compact?: boolean }) {
  const setWorkbook = useStore((s) => s.setWorkbook);
  const workbook = useStore((s) => s.workbook);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true); setError(null);
    try {
      const wb = await parseWorkbook(file);
      setWorkbook(wb);
    } catch (e: any) {
      setError(e?.message ?? "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }, [setWorkbook]);

  if (compact) {
    return (
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {workbook ? `Replace: ${workbook.fileName.slice(0, 24)}` : "Upload .xlsx"}
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </label>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className={`flex h-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border bg-card/40"}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
      </div>
      <div>
        <div className="text-base font-semibold text-foreground">
          {loading ? "Parsing workbook..." : "Drop your customer data dump"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          .xlsx with sheets: Portfolio_info, Holding_data, Trade_data, Market_data, Sec_info, Bank_bal, Cap_gain_loss
        </div>
      </div>
      <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
        Browse file
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </label>
      {error && <div className="text-xs text-[var(--negative)]">{error}</div>}
    </div>
  );
}
