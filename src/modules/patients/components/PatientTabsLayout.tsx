"use client";

import { FullPatientDetails } from "../patient.data";
import { cn } from "@/lib/utils";

import { TabGeneral } from "./tabs/TabGeneral";
import { TabPersonal } from "./tabs/TabPersonal";
import { TabAddress } from "./tabs/TabAddress";
import { TabClinical } from "./tabs/TabClinical";
import { TabTeam } from "./tabs/TabTeam";
import { TabInventory } from "./tabs/TabInventory";
import { TabAdministrative } from "./tabs/TabAdministrative";
import { TabFinancial } from "./tabs/TabFinancial";
import { TabHistoryAudit } from "@/components/patients/v2/tab-history-audit";
import { BusinessProcessFlow, BPF_STEPS } from "@/components/patients/v2/business-process-flow";
import * as React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useGedPanel } from "@/components/ged/ged-panel-provider";

const tabs = [
  { id: "general", label: "Visão Geral" },
  { id: "personal", label: "Dados Pessoais" },
  { id: "address", label: "Endereço & Logística" },
  { id: "clinical", label: "Clínico", alert: true },
  { id: "team", label: "Rede de Apoio" },
  { id: "inventory", label: "Estoque" },
  { id: "administrative", label: "Administrativo" },
  { id: "financial", label: "Financeiro" },
  { id: "history", label: "Histórico" },
];

export function PatientTabsLayout({ patient, embedded = false }: { patient: FullPatientDetails; embedded?: boolean }) {
  const isAdmissionFlow = patient.record_status === "onboarding" || patient.record_status === "draft";
  const [activeTab, setActiveTab] = React.useState(isAdmissionFlow ? "personal" : "general");
  const [localCompleted, setLocalCompleted] = React.useState<string[]>([]);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const { openGedPanel } = useGedPanel();

  const contentWrapper = embedded ? "bg-[#faf9f8] pt-6" : "bg-[#faf9f8] min-h-screen py-8 px-6";
  const innerSpacing = embedded ? "max-w-[1600px] mx-auto px-8" : "max-w-[1600px] mx-auto";

  const completedSteps = [
    ...(patient.full_name ? ["personal"] : []),
    ...(patient.address && patient.address.length > 0 ? ["address"] : []),
    ...(patient.clinical && patient.clinical.length > 0 ? ["clinical"] : []),
    ...(patient.administrative && patient.administrative.length > 0 ? ["administrative"] : []),
    ...(patient.financial && patient.financial.length > 0 ? ["financial"] : []),
    ...(patient.documents && patient.documents.length > 0 ? ["documents"] : []),
    ...(patient.record_status === "active" ? ["review"] : []),
    ...localCompleted,
  ];

  const handleStepChange = (stepId: string) => {
    if (stepId === "documents") {
      openGedPanel({ title: "GED do Paciente" });
      return;
    }
    const map: Record<string, string> = {
      personal: "personal",
      address: "address",
      clinical: "clinical",
      administrative: "administrative",
      financial: "financial",
      review: "general",
    };
    setActiveTab(map[stepId] || "personal");
    setWarnings([]);
  };

  const validateCurrentStep = () => {
    const missing: string[] = [];
    switch (activeTab) {
      case "personal":
        if (!patient.full_name) missing.push("Nome completo");
        if (!patient.cpf) missing.push("CPF");
        if (!patient.date_of_birth) missing.push("Data de nascimento");
        if (!patient.gender) missing.push("Sexo");
        break;
      case "address":
        if (!patient.address?.[0]?.zip_code) missing.push("CEP");
        if (!patient.address?.[0]?.street) missing.push("Rua");
        if (!patient.address?.[0]?.city) missing.push("Cidade");
        if (!patient.address?.[0]?.state) missing.push("UF");
        break;
      case "clinical":
        if (!patient.clinical || patient.clinical.length === 0) missing.push("Perfil clínico");
        break;
      case "administrative":
        if (!patient.administrative || patient.administrative.length === 0) missing.push("Dados administrativos");
        break;
      case "financial":
        if (!patient.financial || patient.financial.length === 0) missing.push("Dados financeiros");
        break;
      default:
        break;
    }
    setWarnings(missing);
    if (missing.length === 0 && !completedSteps.includes(activeTab)) {
      setLocalCompleted((prev) => [...prev, activeTab]);
    }
  };

  const goNext = () => {
    const idx = BPF_STEPS.findIndex((s) => {
      const map: Record<string, string> = {
        personal: "personal",
        address: "address",
        clinical: "clinical",
        administrative: "administrative",
        financial: "financial",
        documents: "documents",
        review: "general",
      };
      return map[s.id] === activeTab || s.id === activeTab;
    });
    const next = BPF_STEPS[idx + 1];
    if (next) handleStepChange(next.id);
  };

  return (
    <>
      {isAdmissionFlow && (
        <div className="mb-4 px-6">
          <BusinessProcessFlow
            activeStep={activeTab === "general" ? "personal" : activeTab}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          />
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              {warnings.length > 0 && (
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                  <WarningCircle className="h-4 w-4" weight="fill" />
                  <span>Pendências: {warnings.join(", ")}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={validateCurrentStep}>
                Validar etapa
              </Button>
              <Button variant="default" size="sm" onClick={goNext}>
                Avançar (permitido com pendências)
              </Button>
            </div>
          </div>
        </div>
      )}
      <div
        className={
          embedded
            ? "border-b border-gray-200 bg-white"
            : "border-b border-gray-200 bg-white"
        }
      >
        <div
          className={
            embedded
              ? "flex gap-6 overflow-x-auto px-8 max-w-[1600px] mx-auto no-scrollbar pt-2"
              : "flex gap-6 overflow-x-auto px-8 max-w-[1600px] mx-auto no-scrollbar"
          }
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 pt-2 text-sm font-semibold transition-all border-b-2 shrink-0 flex items-center gap-2",
                activeTab === tab.id
                  ? "text-[#0F2B45] border-[#0F2B45]"
                  : "text-gray-500 border-transparent hover:text-gray-800"
              )}
            >
              {tab.label}
              {tab.alert && (
                <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">!</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={contentWrapper}>
        <div className={innerSpacing}>
          {activeTab === "general" && <TabGeneral patient={patient} />}
          {activeTab === "personal" && <TabPersonal patient={patient} />}
          {activeTab === "address" && <TabAddress patient={patient} />}
          {activeTab === "clinical" && <TabClinical patient={patient} />}
          {activeTab === "team" && <TabTeam patient={patient} />}
          {activeTab === "inventory" && <TabInventory patient={patient} />}
          {activeTab === "administrative" && <TabAdministrative patient={patient} />}
          {activeTab === "financial" && <TabFinancial patient={patient} />}
          {activeTab === "history" && <TabHistoryAudit patient={patient} />}
        </div>
      </div>
    </>
  );
}
