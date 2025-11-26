import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PatientWizardForm } from "@/components/patients/wizard/patient-wizard-form";
import { Suspense } from "react";

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D46F5D]">Prontuário</p>
            <h1 className="text-3xl font-bold text-[#0F2B45]">Novo Paciente</h1>
            <p className="text-slate-500">Preencha os dados iniciais para criar o prontuário.</p>
          </div>
          <Link href="/patients">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" weight="bold" />
              Voltar
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-sm text-slate-500">Carregando formulário...</div>}>
          <PatientWizardForm />
        </Suspense>
      </div>
    </div>
  );
}
