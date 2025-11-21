export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D46F5D]">Estoque</p>
          <h1 className="text-3xl font-bold text-[#0F2B45]">Inventário & Suprimentos</h1>
          <p className="text-slate-500">Acompanhe EPIs, materiais e entregas domiciliares.</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/80 p-8 text-slate-500">
          Tabelas e dashboards de estoque entram aqui.
        </div>
      </div>
    </div>
  );
}
