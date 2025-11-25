'use client';

import { FullPatientDetails, PatientNextShift } from "../../patient.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WarningOctagon,
  Heartbeat,
  TrendUp,
  Warning,
  WarningCircle,
  MapPin,
  Moon,
  Key,
  PawPrint,
  UsersThree,
  Phone,
  CalendarCheck,
  CalendarX
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmergencyContactDTO } from "@/data/definitions/team";
import { PatientClinicalDTO } from "@/data/definitions/clinical";

export function TabGeneral({ patient }: { patient: FullPatientDetails }) {
  const clinical: Partial<PatientClinicalDTO> = patient.clinical?.[0] || {};
  const address = patient.address?.[0] || {};
  const domicile = patient.domicile?.[0] || {};
  const contacts: EmergencyContactDTO[] = patient.contacts || [];
  const nextShifts: PatientNextShift[] = patient.next_shifts || [];

  const riskLevel = clinical.complexity_level === "critical" || clinical.complexity_level === "high";
  const guardian = contacts.find((c) => c.is_legal_representative);

  return (
    <div className="grid grid-cols-12 gap-6 pb-10">
      {/* ALERTA CLÍNICO */}
      {riskLevel && (
        <div className="col-span-12">
          <div className="bg-white border-l-4 border-rose-600 rounded-r-md shadow-fluent p-4 flex gap-4 items-start">
            <div className="bg-rose-50 p-2 rounded-full text-rose-700 mt-0.5">
              <WarningOctagon weight="fill" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wide">Paciente de Alta Complexidade</h3>
              <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                Requer atenção constante. Verifique os dispositivos e sinais vitais a cada visita.
              </p>
              {clinical.clinical_tags && clinical.clinical_tags.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {clinical.clinical_tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase rounded border border-rose-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATUS CLÍNICO */}
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-white border border-slate-200 border-t-4 border-t-rose-500 rounded-md shadow-fluent h-full flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <span className="text-xs font-bold text-[#0F2B45] uppercase tracking-wide flex items-center gap-2">
              <Heartbeat size={18} className="text-[#0F2B45]" weight="duotone" /> Status Clínico
            </span>
            <Badge
              variant="outline"
              className="bg-rose-50 text-rose-700 border-rose-100 text-[10px] font-bold uppercase"
            >
              {clinical.complexity_level || "N/D"}
            </Badge>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="bg-slate-50 p-3 rounded border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Diagnóstico Principal</p>
              <p className="text-sm font-semibold text-[#0F2B45] line-clamp-2">
                {clinical.diagnosis_main || "Não informado"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <TrendUp weight="bold" /> <span className="text-xs font-semibold">Braden (LPP)</span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {clinical.risk_braden ?? "-"}
                  <span className="text-xs text-slate-400 font-normal">/23</span>
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Warning weight="fill" /> <span className="text-xs font-bold">Morse (Queda)</span>
                </div>
                <p className="text-lg font-bold text-amber-700">
                  {clinical.risk_morse ?? "-"}
                  <span className="text-xs text-amber-400 font-normal">/125</span>
                </p>
              </div>
            </div>

            {clinical.allergies && clinical.allergies.length > 0 && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-rose-600 flex items-center gap-1 mb-1">
                    <WarningCircle weight="fill" /> Alergias
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{clinical.allergies.join(", ")}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LOGÍSTICA */}
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-white border border-slate-200 border-t-4 border-t-[#0F2B45] rounded-md shadow-fluent h-full flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30">
            <span className="text-xs font-bold text-[#0F2B45] uppercase tracking-wide flex items-center gap-2">
              <MapPin size={18} className="text-[#0F2B45]" weight="duotone" /> Logística & Acesso
            </span>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                {address.street}, {address.number}
              </p>
              <p className="text-xs text-slate-500">
                {address.neighborhood} • {address.city}/{address.state}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {address.zone_type === "Risco" && (
                <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                  <Warning weight="bold" /> Zona de Risco
                </span>
              )}
              {domicile.ambulance_access === "Não" && (
                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wide">
                  Sem Acesso Amb.
                </span>
              )}
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2 text-xs font-semibold">
                  <Moon weight="bold" /> Risco Noturno
                </span>
                <span className="font-semibold text-slate-700">{domicile.night_access_risk || "N/D"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2 text-xs font-semibold">
                  <Key weight="bold" /> Portaria
                </span>
                <span className="font-semibold text-slate-700">{domicile.gate_identification || "N/D"}</span>
              </div>
            </div>

            {domicile.pets_description && (
              <div className="bg-amber-50 border border-amber-100 p-2 rounded flex gap-2 items-start">
                <PawPrint weight="fill" className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-700">Animais</p>
                  <p className="text-xs text-amber-800 font-medium">
                    {domicile.pets_description} ({domicile.animals_behavior})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REDE DE APOIO */}
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-600 rounded-md shadow-fluent h-full flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30">
            <span className="text-xs font-bold text-[#0F2B45] uppercase tracking-wide flex items-center gap-2">
              <UsersThree size={18} className="text-[#0F2B45]" weight="duotone" /> Rede de Apoio
            </span>
          </div>
          <div className="p-5 space-y-5 flex-1">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Responsável Legal</p>
              {guardian ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border-2 border-white shadow-sm">
                    {guardian.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{guardian.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-700 uppercase">{guardian.relation}</span>
                      <span>•</span>
                      <span className="font-mono">{guardian.phone}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Não definido.</p>
              )}
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">Contatos de Emergência</p>
              {contacts
                .filter((c) => !c.is_legal_representative)
                .slice(0, 3)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded transition cursor-default border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">{c.full_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{c.relation}</p>
                    </div>
                    <span className="font-mono text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <Phone size={12} /> {c.phone}
                    </span>
                  </div>
                ))}
              {contacts.length === 0 && <p className="text-xs text-slate-400 italic">Sem outros contatos.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* PRÓXIMOS PLANTÕES */}
      <div className="col-span-12">
        <div className="bg-white border border-slate-200 rounded-md shadow-fluent">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-[#0F2B45] uppercase tracking-wide flex items-center gap-2">
              <CalendarCheck size={18} className="text-[#0F2B45]" weight="duotone" /> Agenda Operacional
            </span>
            <Button variant="link" className="text-xs font-bold text-[#0F2B45] h-auto p-0">
              Ver Escala Completa
            </Button>
          </div>
          <div className="p-6">
            {nextShifts.length === 0 ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-3">
                  <CalendarX size={32} className="text-slate-300" weight="duotone" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Nenhum plantão agendado</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Não há escalas futuras confirmadas para este paciente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {nextShifts.slice(0, 5).map((shift) => {
                  const date = new Date(shift.start_time);
                  return (
                    <div
                      key={shift.id}
                      className="border border-slate-100 rounded-md p-3 flex items-center gap-3 bg-white hover:border-slate-300 transition shadow-sm"
                    >
                      <div className="bg-[#0F2B45]/10 text-[#0F2B45] w-10 h-10 rounded flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold uppercase">{format(date, "MMM", { locale: ptBR })}</span>
                        <span className="text-sm font-bold leading-none">{date.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {shift.shift_type === "night" ? "Noturno" : "Diurno"}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {shift.professional?.full_name || "Vaga Aberta"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
