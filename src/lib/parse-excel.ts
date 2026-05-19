import * as XLSX from "xlsx";

export interface ParsedWorkbook {
  Portfolio_info: any[];
  Holding_data: any[];
  Trade_data: any[];
  Market_data: any[];
  Sec_info: any[];
  Bank_bal: any[];
  Cap_gain_loss: any[];
  fileName: string;
  parsedAt: number;
}

const SHEETS = [
  "Portfolio_info",
  "Holding_data",
  "Trade_data",
  "Market_data",
  "Sec_info",
  "Bank_bal",
  "Cap_gain_loss",
] as const;

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const out: any = { fileName: file.name, parsedAt: Date.now() };
  for (const s of SHEETS) {
    const matched = wb.SheetNames.find(
      (n) => n.toLowerCase().replace(/\s+/g, "_") === s.toLowerCase()
    );
    out[s] = matched
      ? XLSX.utils.sheet_to_json(wb.Sheets[matched], { defval: null, raw: true })
      : [];
  }
  return out as ParsedWorkbook;
}
