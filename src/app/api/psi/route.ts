import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";           // ← EdgeではなくNodeで動かす
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },      // ← これが肝。自己署名を許可
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("version_id");
  const from = Number(searchParams.get("from"));
  const to = Number(searchParams.get("to"));
  if (!versionId || !from || !to) {
    return NextResponse.json({ error: "version_id, from, to are required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const q = `
      select
        ip.item_id, ip.location_id, ip.period_key,
        ip.beg_qty, ip.inbound_confirmed_qty, ip.inbound_unconfirmed_qty,
        ip.sales_plan_qty,
        (ip.beg_qty + ip.inbound_confirmed_qty + ip.inbound_unconfirmed_qty - ip.sales_plan_qty) as end_qty,
        greatest(0,
          case when ip.period_key = $2
               then ip.beg_qty + ip.inbound_confirmed_qty + ip.inbound_unconfirmed_qty - ip.sales_plan_qty
               else 0 end
        ) as avail_to_ship
      from inv_plan ip
      where ip.version_id = $1::uuid
        and ip.period_key between $2 and $3
      order by ip.item_id, ip.location_id, ip.period_key;
    `;
    const { rows } = await client.query(q, [versionId, from, to]);

    const grouped: Record<string, any> = {};
    for (const r of rows) {
      const key = `${r.item_id}__${r.location_id}`;
      grouped[key] ??= { item_id: r.item_id, location_id: r.location_id, periods: {} as any };
      grouped[key].periods[r.period_key] = {
        beg: Number(r.beg_qty),
        in_c: Number(r.inbound_confirmed_qty),
        in_u: Number(r.inbound_unconfirmed_qty),
        sales: Number(r.sales_plan_qty),
        end: Number(r.end_qty),
        avail_to_ship: Number(r.avail_to_ship),
      };
    }
    return NextResponse.json({ version_id: versionId, granularity: "month", period: { from, to }, rows: Object.values(grouped) });
  } catch (err: any) {
    console.error("GET /api/psi error:", err);
    return NextResponse.json({ error: err?.message ?? "internal error" }, { status: 500 });
  }
  finally { client.release(); }
}
