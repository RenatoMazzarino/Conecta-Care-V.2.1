'use client';

import { cn } from "@/lib/utils";

type WizardStepperProps = {
  currentStep: number;
};

const steps = [
  { id: 1, label: "Identificação & Docs" },
  { id: 2, label: "Localização" },
  { id: 3, label: "Vínculo Financeiro" },
  { id: 4, label: "Revisão & Ativação" },
];

export function WizardStepper({ currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                isActive
                  ? "border-[#0F2B45] bg-[#0F2B45] text-white"
                  : isCompleted
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              {isCompleted ? "✓" : step.id}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Passo {step.id}</p>
              <p className={cn("text-sm font-bold truncate", isActive ? "text-[#0F2B45]" : "text-slate-700")}>
                {step.label}
              </p>
            </div>
            {!isLast && <div className="flex-1 border-t border-dashed border-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}
