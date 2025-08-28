"use client";
import { useState } from "react";

type Period = { beg:number; in_c:number; in_u:number; sales:number; end:number; avail_to_ship:number; };
type Row = { item_id:string; location_id:string; periods: Record<number, Period> };
type Resp = { version_id:string; period:{from:number; to:number}; rows: Row[] };

const ACTIVE = process.env.NEXT_PUBLIC_ACTIVE_VERSION_ID ?? "";

export default function Page() {
  const [from, setFrom] = useState(202508);
  const [to, setTo] = useState(202512);
  const [data, setData] = useState<Resp|null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const run = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/psi?version_id=${ACTIVE}&from=${from}&to=${to}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "error");
      setData(j);
    } catch(e:any){ setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">PSI</h1>
      <div className="flex gap-3">
        <label className="flex flex-col">from
          <input className="border px-2 py-1 rounded" value={from} onChange={e=>setFrom(+e.target.value)} />
        </label>
        <label className="flex flex-col">to
          <input className="border px-2 py-1 rounded" value={to} onChange={e=>setTo(+e.target.value)} />
        </label>
        <button onClick={run} className="px-3 py-2 rounded bg-black text-white" disabled={loading}>
          {loading ? "Loading..." : "Run"}
        </button>
      </div>

      {err && <div className="text-red-600">Error: {err}</div>}

      {data && (
        <div className="overflow-x-auto">
          <table className="min-w-[720px] border mt-3">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1 text-left">Item</th>
                <th className="border px-2 py-1 text-left">Location</th>
                <th className="border px-2 py-1">Period</th>
                <th className="border px-2 py-1">Beg</th>
                <th className="border px-2 py-1">In(C)</th>
                <th className="border px-2 py-1">In(U)</th>
                <th className="border px-2 py-1">Sales</th>
                <th className="border px-2 py-1">End</th>
                <th className="border px-2 py-1">Avail</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r,i)=>{
                const keys = Object.keys(r.periods).map(Number).sort((a,b)=>a-b);
                return keys.map(k=>{
                  const p = r.periods[k]!;
                  return (
                    <tr key={`${i}-${k}`}>
                      <td className="border px-2 py-1">{r.item_id}</td>
                      <td className="border px-2 py-1">{r.location_id}</td>
                      <td className="border px-2 py-1">{k}</td>
                      <td className="border px-2 py-1 text-right">{p.beg}</td>
                      <td className="border px-2 py-1 text-right">{p.in_c}</td>
                      <td className="border px-2 py-1 text-right">{p.in_u}</td>
                      <td className="border px-2 py-1 text-right">{p.sales}</td>
                      <td className={`border px-2 py-1 text-right ${p.end<0?"text-red-600":""}`}>{p.end}</td>
                      <td className="border px-2 py-1 text-right">{p.avail_to_ship}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
