'use client';

import { useMemo, useState } from "react";
import type { PatientHeaderData } from "@/app/(app)/patients/[patientId]/actions.getHeader";
import type { FullPatientDetails } from "@/modules/patients/patient.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, WarningCircle, FloppyDisk, Printer, ShareNetwork, Prohibit, DotsThree, FolderSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TabDocuments } from "@/modules/patients/components/tabs/TabDocuments";

type Props = {
  patientId: string;
  fallbackPatient?: FullPatientDetails;
  headerData?: PatientHeaderData | null;
  onTabChange?: (tab: string) => void;
  breadcrumbs?: React.ReactNode;
};

const statusColor = (status?: string) => {
  if (!status) return "bg-gray-300";
  if (["active", "ativo"].includes(status)) return "bg-emerald-500";
  if (status === "onboarding" || status === "draft") return "bg-amber-500";
  return "bg-gray-400";
};

function deriveFromPatient(patient?: FullPatientDetails | null): PatientHeaderData | null {
  if (!patient) return null;
  const age = (() => {
    if (!patient.date_of_birth) return "--";
    const dob = new Date(patient.date_of_birth);
    if (Number.isNaN(dob.getTime())) return "--";
    return new Date().getFullYear() - dob.getFullYear();
  })();
  const admin = patient.administrative?.[0];
  const allergies = patient.clinical?.[0]?.allergies || [];
  const risks: string[] = [];
  const riskBraden = patient.clinical?.[0]?.risk_braden;
  const riskMorse = patient.clinical?.[0]?.risk_morse;
  if (riskBraden) risks.push(`Braden: ${riskBraden}`);
  if (riskMorse) risks.push(`Morse: ${riskMorse}`);

  return {
    identity: {
      name: patient.full_name,
      age,
      status: patient.record_status || patient.status || "--",
      type: admin?.admission_type || "Caso",
    },
    contract: {
      origin: (admin as any)?.demand_origin || "—",
      payer: (admin as any)?.primary_payer_type || "—",
      planId: (admin as any)?.external_contract_id || "—",
      validity: (admin as any)?.contract_end_date || "—",
    },
    kpis: {
      scheduleCoverage: 0,
      financialStatus: "ok",
      overdueAmount: 0,
    },
    alerts: {
      allergies,
      risks,
    },
  };
}

export function PatientHeader({ patientId, headerData, fallbackPatient, onTabChange, breadcrumbs }: Props) {
  const data = headerData || deriveFromPatient(fallbackPatient);
  const loading = !data;
  const [openGed, setOpenGed] = useState(false);

  const initials = useMemo(() => {
    const name = data?.identity.name || "";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "--";
  }, [data?.identity.name]);

  if (loading) {
    return (
      <div className="bg-white border-b border-slate-200 shadow-sm px-8 py-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const hasAlerts = (data.alerts?.allergies?.length || 0) > 0 || (data.alerts?.risks?.length || 0) > 0;
  const ageText = data.identity.age ? `${data.identity.age} anos` : "--";
  const contractorName = data.contract.payer || "—";

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 pt-4 pb-2 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-3 text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <FloppyDisk size={16} weight="bold" /> Salvar e Fechar
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Printer size={16} /> Imprimir Ficha
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <ShareNetwork size={16} /> Compartilhar
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-rose-700 hover:bg-rose-50">
              <Prohibit size={16} /> Inativar
            </Button>
            {fallbackPatient && (
              <Sheet open={openGed} onOpenChange={setOpenGed}>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <FolderSimple size={16} /> Documentos (GED)
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>GED do Paciente</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <TabDocuments patient={fallbackPatient} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Button variant="ghost" size="sm" className="gap-1">
              <DotsThree size={18} /> Mais
            </Button>
          </div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            ⟳ Última alteração: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-xl">{initials}</AvatarFallback>
              </Avatar>
              <span className={cn("absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white", statusColor(data.identity.status))} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">HOME CARE</Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{data.identity.name}</h1>
              <div className="flex flex-wrap gap-6 text-sm text-slate-700">
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">Data nasc. (idade)</p>
                  <p className="font-semibold text-slate-900">{fallbackPatient?.date_of_birth || "--"} ({ageText})</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">CPF</p>
                  <p className="font-semibold text-slate-900">{fallbackPatient?.cpf || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-semibold mb-0.5">Matrícula / Convênio</p>
                  <p className="font-semibold text-blue-700 hover:underline cursor-pointer">{contractorName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-slate-50 rounded border border-slate-200 text-right min-w-[140px]">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Escala (mês)</p>
              <p className="text-2xl font-bold text-slate-900">
                {data.kpis.scheduleCoverage}% <span className="text-xs font-normal text-slate-600 ml-1">Coberta</span>
              </p>
            </div>
            <div className="px-4 py-3 bg-slate-50 rounded border border-slate-200 text-right min-w-[140px]">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Financeiro</p>
              {data.kpis.financialStatus === "ok" ? (
                <p className="text-2xl font-bold text-emerald-600">
                  OK <span className="text-xs font-normal text-slate-600 ml-1">Em dia</span>
                </p>
              ) : (
                <p className="text-2xl font-bold text-rose-600">
                  R$ {data.kpis.overdueAmount.toFixed(2)} <span className="text-xs font-normal text-rose-500 ml-1">Atraso</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {hasAlerts && (
          <div className="mt-2 border border-red-200 bg-red-50 px-4 py-2 flex items-center gap-3 text-sm text-red-800 rounded">
            <WarningCircle className="h-5 w-5" />
            <div className="flex flex-wrap gap-2">
              {data.alerts?.allergies?.length > 0 && <span className="font-semibold">Alergias: {data.alerts.allergies.join(", ")}</span>}
              {data.alerts?.risks?.length > 0 && <span>Riscos: {data.alerts.risks.join(", ")}</span>}
            </div>
            <Button variant="link" className="text-red-700 px-2" onClick={() => onTabChange?.("clinical")}>Ver detalhes</Button>
          </div>
        )}
      </div>
    </div>
  );
}
