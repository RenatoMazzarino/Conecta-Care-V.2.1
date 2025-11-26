'use client';

import { cn } from "@/lib/utils";
import { CheckCircle } from "@phosphor-icons/react";

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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-4">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const base =
            "flex items-center gap-3 px-4 py-3 border-r border-slate-200 bg-white";
          return (
            <div
              key={step.id}
              className={cn(base, {
                "text-slate-400": !isActive && !isCompleted,
                "border-r-0": idx === steps.length - 1,
              })}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                  isActive
                    ? "bg-[#0F2B45] text-white"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {isCompleted ? <CheckCircle weight="fill" /> : step.id}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Passo {step.id}</p>
                <p
                  className={cn(
                    "text-sm font-semibold truncate pb-1",
                    isActive ? "text-slate-900 border-b-2 border-b-[#0F2B45]" : "text-slate-600"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
