'use client';

import useSWR from "swr";
import { getPatientOverview } from "@/app/(app)/patients/[patientId]/actions.getOverview";
import { FullPatientDetails } from "../../patient.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heartbeat, MapPin, Users, Calendar, WarningCircle } from "@phosphor-icons/react";

type OverviewData = Awaited<ReturnType<typeof getPatientOverview>>;

const complexityTone = (level?: string) => {
  switch (level) {
    case "critical":
      return "bg-rose-100 text-rose-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
};

const RiskBar = ({ score, max, color }: { score?: number; max: number; color: string }) => {
  const pct = score !== undefined ? Math.min(100, Math.round((score / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500">Score: {score ?? "—"}</p>
    </div>
  );
};

const fetcher = (id: string) => getPatientOverview(id);

export function TabGeneral({ patient }: { patient: FullPatientDetails }) {
  const { data, isLoading } = useSWR<OverviewData>(patient.id, fetcher);

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const clinical = data.clinical;
  const logistics = data.logistics;
  const support = data.support;
  const schedule = data.schedule;

  const braden = clinical.risks.find((r: any) => r.risk_type === "braden");
  const morse = clinical.risks.find((r: any) => r.risk_type === "morse");

  const legal = support.find((s) => s.is_legal_guardian) || support[0];
  const emergencies = support.filter((s) => s.is_emergency_contact).slice(0, 2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Clínico */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="flex items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
            <Heartbeat className="w-5 h-5" /> Perfil Clínico
          </CardTitle>
          <Badge className={complexityTone(clinical.summary?.complexity_level)}>{clinical.summary?.complexity_level || "N/D"}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div>
            <p className="text-xs uppercase text-slate-500">Diagnóstico Principal</p>
            {clinical.summary?.cid_main ? (
              <p className="text-lg font-semibold text-slate-900">{clinical.summary.cid_main}</p>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 text-xs">Não Informado</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {clinical.devices?.map((d: string) => (
              <Badge key={d} className="bg-emerald-100 text-emerald-700 text-[10px]">
                {d}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-[11px] uppercase text-slate-500">Braden</p>
              <RiskBar score={braden?.score} max={23} color="bg-amber-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase text-slate-500">Morse</p>
              <RiskBar score={morse?.score} max={125} color="bg-rose-500" />
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => (window.location.hash = "clinical")}>
            Ver Prontuário
          </Button>
        </CardContent>
      </Card>

      {/* Logística */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="flex items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
            <MapPin className="w-5 h-5" /> Acesso ao Domicílio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="text-sm text-slate-800 font-semibold">
            {logistics?.neighborhood || "Bairro N/D"} - {logistics?.city || "Cidade N/D"}
          </div>
          <div className="flex gap-2 text-xs flex-wrap">
            <Badge className={logistics?.ambulance_access === "Não" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}>
              Ambulância: {logistics?.ambulance_access || "N/D"}
            </Badge>
            {logistics?.night_access_risk && (
              <Badge className="bg-amber-100 text-amber-800">Risco Noturno: {logistics.night_access_risk}</Badge>
            )}
          </div>
          <div className="text-sm text-slate-600 line-clamp-2">Entrada: {logistics?.entry_procedure || "Sem instruções"}</div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.hash = "address")}>
            Detalhes
          </Button>
        </CardContent>
      </Card>

      {/* Rede de apoio */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="flex items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
            <Users className="w-5 h-5" /> Responsáveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {legal ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{legal.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-slate-900">{legal.full_name}</p>
                <p className="text-xs text-slate-500">
                  {legal.relation || "Responsável"} • {legal.phone_primary || "Sem telefone"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-rose-700 flex items-center gap-2">
              <WarningCircle /> Sem Responsável Legal
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[11px] uppercase text-slate-500">Emergência 24h</p>
            {emergencies.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum contato de emergência.</p>
            ) : (
              emergencies.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                  <span className="font-semibold text-slate-800">{e.full_name}</span>
                  <span className="text-xs text-slate-500">{e.phone_primary || "Sem telefone"}</span>
                </div>
              ))
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => (window.location.hash = "team")}>
            Ver Contatos
          </Button>
        </CardContent>
      </Card>

      {/* Agenda */}
      <Card className="shadow-fluent border-slate-200">
        <CardHeader className="flex items-center justify-between border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
            <Calendar className="w-5 h-5" /> Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {schedule.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum agendamento futuro.</p>
          ) : (
            schedule.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{new Date(s.start_time).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-[10px]">
                    {s.shift_type || "Plantão"}
                  </Badge>
                  <p className="text-xs text-slate-600">{(s.professional as any)?.full_name || "Equipe"}</p>
                </div>
              </div>
            ))
          )}
          <Button variant="ghost" size="sm">
            Ver Escala Completa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
