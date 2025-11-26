"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PatientWizardForm } from "@/components/patients/wizard/patient-wizard-form";
import { Suspense, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) router.push("/patients");
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl xl:max-w-7xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nova Admissão</DialogTitle>
        </DialogHeader>
        <div className="min-h-[80vh] bg-slate-50/50 flex flex-col">
          <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pacientes &gt; Nova Admissão</p>
              <p className="text-2xl font-semibold tracking-tight text-[#0F2B45] mt-1">Wizard de Admissão</p>
              <p className="text-sm text-slate-500">Preencha os dados em etapas com salvamento imediato.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/patients">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" weight="bold" />
                  Cancelar
                </Button>
              </Link>
              <Button variant="ghost" className="border border-slate-200 bg-white text-slate-700">
                Salvar Rascunho
              </Button>
            </div>
          </div>

          <div className="max-w-screen-2xl w-full mx-auto p-4 md:p-6">
            <Suspense fallback={<div className="text-sm text-slate-500">Carregando formulário...</div>}>
              <PatientWizardForm />
            </Suspense>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
