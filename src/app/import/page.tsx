"use client";

import Papa from "papaparse";
import { useState } from "react";

export default function ImportPage() {
  const [table, setTable] = useState<"sku" | "sales_plan">("sku");
  const [log, setLog] = useState("");

  const onFile = (file: File) => {
    setLog("Parsing...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        setLog(`Parsed ${result.data.length} rows. Uploading...`);
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, rows: result.data }),
        });
        const json = await res.json();
        setLog(res.ok ? `Done: ${json.count} rows` : `Error: ${json.error}`);
      },
    });
  };

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">CSV Import</h1>

      <label className="block">
        <span className="mr-2 font-semibold">Table:</span>
        <select
          className="border px-2 py-1"
          value={table}
          onChange={(e) => setTable(e.target.value as any)}
        >
          <option value="sku">sku</option>
          <option value="sales_plan">sales_plan</option>
        </select>
      </label>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      <pre className="p-2 bg-gray-50 border whitespace-pre-wrap">{log}</pre>
    </main>
  );
}
