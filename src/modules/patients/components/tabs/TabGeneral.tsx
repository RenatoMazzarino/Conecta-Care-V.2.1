'use client';

import { FullPatientDetails } from "../../patient.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Warning,
  Heartbeat,
  MapPin,
  Phone,
  CalendarCheck,
  TrendUp,
  CaretRight,
  CheckCircle,
  Clock,
  ShieldWarning,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper components
function SummaryCard({ icon: Icon, title, action, children, className }: any) {
  return (
    <Card className={cn("flex h-full flex-col border-slate-200 shadow-sm", className)}>
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
            <Icon className="h-4 w-4 text-slate-500" />
            {title}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value, icon: Icon, alert }: any) {
  return (
    <div className="flex items-start justify-between border-b border-slate-50 py-2 last:border-0">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {Icon && <Icon className={cn("h-4 w-4", alert ? "text-rose-500" : "text-slate-400")} />}
        {label}
      </div>
      <div className={cn("text-right text-sm font-semibold", alert ? "text-rose-700" : "text-slate-800")}>
        {value || "—"}
      </div>
    </div>
  );
}

export function TabGeneral({ patient }: { patient: FullPatientDetails }) {
  const clinical = patient.clinical?.[0] || {};
  const address = patient.address?.[0] || {};
  const domicile = (patient as any)?.domicile?.[0] || {};
  const contacts = patient.contacts || [];
  const medications = (patient as any)?.medications || [];

  const criticalMeds = medications.filter((m: any) => m.is_critical).length;
  const riskLevel = clinical.complexity_level === "critical" || clinical.complexity_level === "high";
  const guardian = contacts.find((c: any) => c.is_legal_representative);

  return (
    <div className="space-y-6 pb-10">
      {riskLevel && (
        <div className="flex items-start gap-3 rounded-md border-l-4 border-rose-500 bg-rose-50 p-4 shadow-sm">
          <ShieldWarning size={24} className="mt-0.5 text-rose-600" weight="fill" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-rose-800">Paciente de Alta Complexidade</h3>
            <p className="mt-1 text-sm text-rose-700">
              Requer atenção constante. Verifique os dispositivos e sinais vitais a cada visita.
              {clinical.clinical_tags && clinical.clinical_tags.length > 0 && (
                <span className="mt-1 block font-semibold">Dispositivos: {clinical.clinical_tags.join(", ")}</span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={Heartbeat}
          title="Status Clínico"
          action={
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                riskLevel ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              {clinical.complexity_level?.toUpperCase() || "NÃO CLASS."}
            </Badge>
          }
        >
          <div className="space-y-1">
            <div className="mb-3 rounded border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Diagnóstico Principal</p>
              <p className="text-sm font-semibold text-[#0F2B45] line-clamp-2">{clinical.diagnosis_main || "Não informado"}</p>
            </div>
            <InfoRow label="Braden (LPP)" value={clinical.risk_braden ? `${clinical.risk_braden}/23` : null} icon={TrendUp} />
            <InfoRow
              label="Morse (Queda)"
              value={clinical.risk_morse ? `${clinical.risk_morse}/125` : null}
              icon={Warning}
              alert={clinical.risk_morse > 45}
            />
            <InfoRow label="Alergias" value={clinical.allergies?.join(", ")} icon={Warning} alert={clinical.allergies?.length > 0} />
            <InfoRow
              label="Meds Críticos"
              value={criticalMeds > 0 ? `${criticalMeds} ativos` : "Nenhum"}
              icon={Warning}
              alert={criticalMeds > 0}
            />
          </div>
        </SummaryCard>

        <SummaryCard icon={MapPin} title="Logística & Acesso">
          <div className="space-y-1">
            <p className="mb-2 text-sm font-medium text-slate-600">
              {address.street}, {address.number} <br />
              <span className="text-xs text-slate-400">
                {address.neighborhood} - {address.city}/{address.state}
              </span>
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {address.zone_type === "Risco" && <Badge variant="destructive" className="text-[10px]">ZONA DE RISCO</Badge>}
              {domicile.ambulance_access === "Não" && (
                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">
                  SEM ACESSO AMB.
                </Badge>
              )}
            </div>
            <InfoRow
              label="Risco Noturno"
              value={domicile.night_access_risk}
              icon={Clock}
              alert={domicile.night_access_risk === "Alto"}
            />
            <InfoRow label="Chaves/Portaria" value={domicile.gate_identification} icon={CheckCircle} />
            {domicile.animals_behavior && (
              <div className="mt-2 flex items-center gap-2 rounded border border-amber-100 bg-amber-50 p-2 text-xs text-amber-800">
                <Warning className="h-3 w-3" />
                Pets: {domicile.pets_description} ({domicile.animals_behavior})
              </div>
            )}
          </div>
        </SummaryCard>

        <SummaryCard icon={Phone} title="Rede de Apoio">
          {guardian ? (
            <div className="mb-4">
              <p className="mb-1 text-xs font-bold uppercase text-slate-400">Responsável Legal</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D46F5D]/10 text-xs font-bold text-[#D46F5D]">
                  {guardian.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{guardian.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {guardian.relation} • {guardian.phone}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-4 text-sm italic text-slate-400">Sem responsável legal definido.</p>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-400">Contatos de Emergência</p>
            {contacts
              .filter((c: any) => !c.is_legal_representative)
              .slice(0, 3)
              .map((contact: any) => (
                <div
                  key={contact.id}
                  className="flex justify-between border-b border-slate-50 py-1 text-sm last:border-0"
                >
                  <span className="text-slate-600">
                    {contact.full_name} ({contact.relation})
                  </span>
                  <span className="text-xs font-mono text-slate-500">{contact.phone}</span>
                </div>
              ))}
            {contacts.length === 0 && <p className="text-xs text-slate-400">Nenhum outro contato.</p>}
          </div>

          <Button variant="outline" size="sm" className="mt-4 w-full text-xs">
            Ver Lista Completa
          </Button>
        </SummaryCard>

        <SummaryCard icon={CalendarCheck} title="Próximos Plantões" className="md:col-span-2 xl:col-span-3">
          <div className="flex flex-col gap-4 md:flex-row">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-1 items-center gap-3 rounded-md border border-slate-100 p-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-slate-100 text-[#0F2B45]">
                  <span className="text-xs font-bold uppercase">{format(new Date(), "MMM", { locale: ptBR })}</span>
                  <span className="text-lg font-bold leading-none">{new Date().getDate() + i}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Plantão Diurno (12h)</p>
                  <p className="text-xs text-slate-500">Téc. Ana Silva • 07:00 - 19:00</p>
                  <Badge variant="secondary" className="mt-1 text-[10px] bg-blue-50 text-blue-700">
                    Previsto
                  </Badge>
                </div>
                <CaretRight className="ml-auto text-slate-300" />
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}
