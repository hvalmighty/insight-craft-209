import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getCustomers } from "@/lib/selectors";
import { Users } from "lucide-react";

export function CustomerSelector() {
  const wb = useStore((s) => s.workbook);
  const selected = useStore((s) => s.selectedCustomer);
  const setCustomer = useStore((s) => s.setCustomer);
  const customers = useMemo(() => (wb ? getCustomers(wb) : []), [wb]);

  if (!wb) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1">
      <Users className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={selected ?? ""}
        onChange={(e) => setCustomer(e.target.value || null)}
        className="border-0 bg-transparent text-xs font-medium text-foreground outline-none"
      >
        {customers.length === 0 && <option value="">No customers</option>}
        {customers.map((c) => (
          <option key={c.id} value={c.id} className="bg-popover">
            {c.id}
          </option>
        ))}
      </select>
      <span className="text-[10px] text-muted-foreground">
        {customers.length} cust · {wb.Holding_data.length.toLocaleString()} rows
      </span>
    </div>
  );
}
