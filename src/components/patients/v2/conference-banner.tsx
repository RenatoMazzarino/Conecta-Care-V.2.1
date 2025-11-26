'use client';

import { ShieldCheck, Info } from "@phosphor-icons/react";

export function ConferenceBanner({ status }: { status?: string | null }) {
  const label =
    status === "onboarding"
      ? "Em admissão — continue o passo a passo para ativar"
      : status === "draft"
      ? "Rascunho — complete os dados para prosseguir"
      : "Status ativo";
  const tone =
    status === "onboarding"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : status === "draft"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const Icon = status === "active" ? ShieldCheck : Info;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-semibold ${tone}`}>
      <Icon className="h-4 w-4" weight="fill" />
      <span>{label}</span>
    </div>
  );
}
