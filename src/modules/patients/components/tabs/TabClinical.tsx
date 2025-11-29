'use client';

import useSWR from "swr";
import { format } from "date-fns";
import { Heartbeat, Gauge, Wind, ClipboardText, Pill, WarningCircle } from "@phosphor-icons/react";
import { FullPatientDetails } from "../../patient.data";
import { ClinicalDashboard } from "@/modules/patients/clinical-dashboard.data";
import { GedTriggerButton } from "@/components/ged/GedTriggerButton";
import { DocumentDomainEnum } from "@/data/definitions/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const complexityBadge = (level?: string | null) => {
  const map: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-rose-100 text-rose-800",
  };
  return map[level || "medium"] || "bg-slate-100 text-slate-700";
};

const formatDate = (date?: string | null, fallback = "—") => {
  if (!date) return fallback;
  const jsDate = new Date(date);
  if (Number.isNaN(jsDate.getTime())) return fallback;
  return format(jsDate, "dd/MM/yyyy HH:mm");
};

const RiskCard = ({ name, score, maxScore, riskLevel, assessedAt }: ClinicalDashboard["riskScores"][number]) => {
  const percent = maxScore ? Math.min(100, Math.max(0, ((score ?? 0) / maxScore) * 100)) : undefined;
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{name}</span>
        {assessedAt && <span>{formatDate(assessedAt)}</span>}
      </div>
      <p className="text-lg font-semibold text-slate-900">{score ?? "—"}</p>
      {riskLevel && <p className="text-xs text-slate-600">{riskLevel}</p>}
      {percent !== undefined && (
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#0F2B45]" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
};

export function TabClinical({ patient }: { patient: FullPatientDetails }) {
  const { data, error } = useSWR<{ data: ClinicalDashboard }>(
    `/api/patients/${patient.id}/clinical-dashboard`,
    fetcher,
  );

  const dashboard = data?.data;
  const loading = !dashboard && !error;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex justify-end">
        {/* Atalho contextual: abre o GED já filtrado pelo domínio clínico */}
        <GedTriggerButton
          variant="outline"
          size="sm"
          title="GED — Clínico"
          label="Abrir GED clínico"
          filters={{
            domain: DocumentDomainEnum.enum.Clinico,
          }}
        />
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Não foi possível carregar o resumo clínico. Tente novamente em instantes.
        </div>
      )}

      {loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(6)].map((_, idx) => (
            <Card key={idx} className="shadow-fluent border-slate-100">
              <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1 */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                  <Heartbeat className="h-5 w-5" /> Resumo Clínico Geral
                </CardTitle>
                <Badge className={complexityBadge(dashboard.summary?.complexityLevel)}>
                  {dashboard.summary?.complexityLevel || "—"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="text-sm text-slate-600">
                Última atualização em <strong>{formatDate(dashboard.summary?.lastUpdateAt)}</strong>
                {dashboard.summary?.referenceProfessional?.name && (
                  <> por <strong>{dashboard.summary.referenceProfessional.name}</strong></>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {dashboard.summary?.clinicalSummary || "Nenhum resumo clínico disponível."}
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                <ClipboardText className="h-5 w-5" /> Diagnósticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-xs uppercase text-slate-500">CID Principal</p>
                <p className="text-sm font-semibold text-slate-800">
                  {dashboard.diagnoses.primaryCid || "—"} — {dashboard.diagnoses.primaryDescription || "Sem descrição"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase text-slate-500">Diagnósticos secundários</p>
                <div className="flex flex-wrap gap-2">
                  {dashboard.diagnoses.secondary.length === 0 && <span className="text-sm text-slate-500">Nenhum diagnóstico adicional informado.</span>}
                  {dashboard.diagnoses.secondary.map((diag) => (
                    <Badge key={diag} variant="secondary" className="text-[11px]">{diag}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="link" size="sm" className="px-0 text-[#0F2B45]" disabled>
                Ver mais no prontuário (em breve)
              </Button>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                <Gauge className="h-5 w-5" /> Escalas e Riscos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 md:grid-cols-2">
              {dashboard.riskScores.length === 0 && <p className="text-sm text-slate-500">Nenhuma escala avaliada.</p>}
              {dashboard.riskScores.map((risk) => (
                <RiskCard key={risk.name} {...risk} />
              ))}
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                <WarningCircle className="h-5 w-5" /> Alergias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {dashboard.allergies.length === 0 && <p className="text-sm text-slate-500">Nenhuma alergia ativa cadastrada.</p>}
              {dashboard.allergies.map((item) => (
                <div key={item.id} className="rounded border border-rose-100 bg-rose-50 p-3 text-sm">
                  <div className="font-semibold text-rose-800">{item.allergen || "Alergia"}</div>
                  <p className="text-rose-700">Reação: {item.reaction || "—"}</p>
                  <div className="text-xs text-rose-700">Gravidade: {item.severity || "Não informado"} · Desde {formatDate(item.since)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card 5 */}
          <Card className="shadow-fluent border-slate-200 lg:col-span-2">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                <Pill className="h-5 w-5" /> Medicações em uso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {dashboard.medications.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma medicação ativa registrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicamento</TableHead>
                        <TableHead>Posologia</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Via</TableHead>
                        <TableHead>Atualizado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.medications.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {med.isCritical && <Badge variant="destructive" className="text-[10px]">Crítica</Badge>}
                              <span className="font-semibold text-slate-800">{med.name || "Medicação"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{med.dosage || "—"}</TableCell>
                          <TableCell>{med.frequency || "—"}</TableCell>
                          <TableCell>{med.route || "—"}</TableCell>
                          <TableCell>{formatDate(med.updatedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 6 */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                <Wind className="h-5 w-5" /> Terapia de O2 & Dispositivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Terapia de Oxigênio</p>
                {dashboard.oxygenTherapy ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <div>Fluxo: <strong>{dashboard.oxygenTherapy.flow ?? "—"}</strong> L/min</div>
                    <div>Interface: <strong>{dashboard.oxygenTherapy.interface || "—"}</strong></div>
                    <div>Modo/Fonte: <strong>{dashboard.oxygenTherapy.mode || dashboard.oxygenTherapy.source || "—"}</strong></div>
                    <div>Desde: <strong>{formatDate(dashboard.oxygenTherapy.since)}</strong></div>
                    {dashboard.oxygenTherapy.notes && <div>Observações: {dashboard.oxygenTherapy.notes}</div>}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Sem terapia de O2 ativa.</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Dispositivos ativos</p>
                <div className="mt-2 space-y-2">
                  {dashboard.devices.length === 0 && <p className="text-sm text-slate-500">Nenhum dispositivo cadastrado.</p>}
                  {dashboard.devices.map((device) => (
                    <div key={device.id} className="rounded border border-slate-100 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold text-slate-800">{device.type || "Dispositivo"}</p>
                      <p className="text-slate-600">{device.description || "Sem descrição"}</p>
                      <p className="text-xs text-slate-500">Instalado em {formatDate(device.installedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 7 */}
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base text-[#0F2B45]">Tags Clínicas & Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dashboard.tags.length === 0 && <span className="text-sm text-slate-500">Nenhuma tag clínica.</span>}
                  {dashboard.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[11px] uppercase tracking-wide">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Observações adicionais</p>
                <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {dashboard.observations || "Nenhuma observação adicional registrada."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
