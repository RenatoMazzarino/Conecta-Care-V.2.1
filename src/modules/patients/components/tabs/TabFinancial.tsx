'use client';

type TabFinancialProps = {
  patientId: string;
};

export function TabFinancial({ patientId }: TabFinancialProps) {
  const summary = [
    { label: "Tipo de vínculo", value: "Defina via campo bond_type" },
    { label: "Mensalidade estimada", value: "R$ 0,00" },
    { label: "Dia de vencimento", value: "--" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
        Persista os dados financeiros usando <code className="font-mono text-[#0F2B45]">patient_financial_profiles</code>{" "}
        por meio de uma server action dedicada. ID do paciente:{" "}
        <span className="font-mono text-[#0F2B45]">{patientId}</span>.
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-[#0F2B45]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
