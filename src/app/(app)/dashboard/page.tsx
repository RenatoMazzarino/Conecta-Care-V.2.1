export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D46F5D]">Visão geral</p>
          <h1 className="text-3xl font-bold text-[#0F2B45]">Dashboard</h1>
          <p className="text-slate-500">Painel protegido para acompanhar os indicadores da operação.</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/80 p-8 text-slate-500">
          Blocos de métricas e gráficos chegam aqui. 🔒
        </div>
      </div>
    </div>
  );
}
