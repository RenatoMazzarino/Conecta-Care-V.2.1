"use client";

import { useState } from "react";
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
import { TabDocuments } from "./tabs/TabDocuments";
import { TabHistory } from "./tabs/TabHistory";
import { TabHistoryAudit } from "@/components/patients/v2/tab-history-audit";

const tabs = [
  { id: "general", label: "Visão Geral" },
  { id: "personal", label: "Dados Pessoais" },
  { id: "address", label: "Endereço & Logística" },
  { id: "clinical", label: "Clínico", alert: true },
  { id: "team", label: "Rede de Apoio" },
  { id: "inventory", label: "Estoque" },
  { id: "administrative", label: "Administrativo" },
  { id: "financial", label: "Financeiro" },
  { id: "documents", label: "Documentos" },
  { id: "history", label: "Histórico" },
];

export function PatientTabsLayout({ patient, embedded = false }: { patient: FullPatientDetails; embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState("general");

  const contentWrapper = embedded ? "bg-[#faf9f8] pt-6" : "bg-[#faf9f8] min-h-screen py-8 px-6";
  const innerSpacing = embedded ? "max-w-[1600px] mx-auto px-8" : "max-w-[1600px] mx-auto";

  return (
    <>
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
          {activeTab === "documents" && <TabDocuments patient={patient} />}
          {activeTab === "history" && <TabHistoryAudit patient={patient} />}
        </div>
      </div>
    </>
  );
}
