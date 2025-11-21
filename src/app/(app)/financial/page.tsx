export default function FinancialPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D46F5D]">Financeiro</p>
          <h1 className="text-3xl font-bold text-[#0F2B45]">Gestão Financeira</h1>
          <p className="text-slate-500">Centralize boletos, planos e recebíveis do paciente.</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/80 p-8 text-slate-500">
          Área reservada para cards de faturamento e projeções.
        </div>
      </div>
    </div>
  );
}
