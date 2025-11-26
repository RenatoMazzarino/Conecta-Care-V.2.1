'use client';

import { CheckCircle, Circle, Dot } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type BpfStep = {
  id: string;
  label: string;
};

export const BPF_STEPS: BpfStep[] = [
  { id: "personal", label: "Dados Pessoais & Rede" },
  { id: "address", label: "Endereço & Logística" },
  { id: "clinical", label: "Clínico" },
  { id: "administrative", label: "Administrativo" },
  { id: "financial", label: "Financeiro" },
  { id: "documents", label: "Documentos" },
  { id: "review", label: "Revisão & Ativação" },
];

type BusinessProcessFlowProps = {
  activeStep: string;
  onStepChange: (stepId: string) => void;
  completedSteps?: string[];
};

export function BusinessProcessFlow({ activeStep, onStepChange, completedSteps = [] }: BusinessProcessFlowProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center overflow-x-auto no-scrollbar">
        {BPF_STEPS.map((step, idx) => {
          const isActive = activeStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isLast = idx === BPF_STEPS.length - 1;
          return (
            <div
              key={step.id}
              className="flex items-center min-w-0 flex-1"
            >
              <button
                type="button"
                onClick={() => onStepChange(step.id)}
                className={cn(
                  "flex flex-1 items-center gap-3 px-4 py-3 transition-colors border-r border-slate-200 text-left",
                  isActive ? "bg-primary/5 text-slate-900" : "bg-white text-slate-600"
                )}
              >
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center border",
                    isActive
                      ? "bg-[#0F2B45] text-white border-[#0F2B45]"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-300"
                  )}
                >
                  {isCompleted ? <CheckCircle weight="fill" /> : isActive ? <Dot weight="fill" /> : <Circle weight="duotone" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fase {idx + 1}</p>
                  <p className="text-sm font-semibold truncate">{step.label}</p>
                </div>
              </button>
              {!isLast && <div className="h-px w-6 bg-slate-200" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
