import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase
    .from("v_sku_basic") // ← ビュー経由で読む
    .select("*")
    .limit(20);

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">JUQUU</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">JUQUU / SKU一覧</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-2 py-1 text-left">SKU</th>
            <th className="border px-2 py-1 text-left">Item</th>
            <th className="border px-2 py-1 text-left">Category</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((r: any) => (
            <tr key={r.sku_code}>
              <td className="border px-2 py-1">{r.sku_code}</td>
              <td className="border px-2 py-1">{r.item_name}</td>
              <td className="border px-2 py-1">{r.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
