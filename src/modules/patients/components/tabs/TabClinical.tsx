'use client';
/* eslint-disable react-hooks/incompatible-library */

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientClinicalSchema, PatientClinicalDTO } from "@/data/definitions/clinical";
import { upsertClinicalAction } from "@/modules/patients/actions.upsertClinical";
import { FullPatientDetails } from "@/modules/patients/patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heartbeat, Pill, Plus, Trash, Wind, ChartBar, Tag, WarningCircle } from "@phosphor-icons/react";

type TabClinicalProps = { patient: FullPatientDetails };

export function TabClinical({ patient }: TabClinicalProps) {
  const clinical: Partial<PatientClinicalDTO> = patient.clinical?.[0] || {};
  const medicationsList = patient.medications ?? [];
  type MedicationInput = PatientClinicalDTO["medications"] extends Array<infer U> ? U : never;

  const form = useForm<PatientClinicalDTO>({
    resolver: zodResolver(PatientClinicalSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      complexity_level: clinical.complexity_level ?? "medium",
      diagnosis_main: clinical.diagnosis_main ?? "",
      clinical_summary_note: clinical.clinical_summary_note ?? "",
      risk_braden: clinical.risk_braden ?? 0,
      risk_morse: clinical.risk_morse ?? 0,
      oxygen_usage: clinical.oxygen_usage ?? false,
      oxygen_flow: clinical.oxygen_flow ?? "",
      oxygen_equipment: clinical.oxygen_equipment ?? "",
      clinical_tags: clinical.clinical_tags ?? [],
      medications: medicationsList.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage || undefined,
        frequency: m.frequency || undefined,
        route: m.route || undefined,
        is_critical: m.is_critical ?? false,
        status: (m.status ?? "active") as MedicationInput["status"],
      })),
    },
  });

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const toggleTag = (tag: string, currentTags: string[] = []) => {
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
    form.setValue("clinical_tags", newTags);
  };

  async function onSubmit(data: PatientClinicalDTO) {
    const res = await upsertClinicalAction(data);
    if (res.success) toast.success("Dados clínicos atualizados!");
    else toast.error(res.error);
  }

  const oxygenActive = form.watch("oxygen_usage");
  const currentTags = form.watch("clinical_tags") || [];

  const labelCls = "text-[11px] font-bold uppercase text-slate-500 tracking-wider";
  const inputCls = "h-9 text-sm";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-12 gap-6 pb-20">
        {/* COLUNA ESQUERDA */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Perfil Assistencial */}
          <Card className="border border-slate-200 border-t-4 border-t-rose-600 rounded-md shadow-fluent">
            <CardHeader className="border-b border-slate-100 pb-3 bg-white flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-700">
                <Heartbeat size={18} weight="duotone" /> Perfil Assistencial
              </CardTitle>
              {(clinical.complexity_level === "high" || clinical.complexity_level === "critical") && (
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold uppercase">Alta Complexidade</Badge>
              )}
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-9">
                  <FormField
                    control={form.control}
                    name="diagnosis_main"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Diagnóstico Principal (CID)</FormLabel>
                        <FormControl>
                          <Input {...field} className={`${inputCls} font-semibold`} placeholder="Ex: Sequela de AVC (I69.3)" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="complexity_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Complexidade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputCls}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica (UTI)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-12">
                  <FormLabel className={`${labelCls} mb-2 block flex items-center gap-2`}><Tag /> Dispositivos em Uso</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {["GTT", "TQT", "SVD", "Cadeirante", "Acamado"].map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag, currentTags)}
                        className={`rounded-md border px-4 py-2 text-xs font-semibold transition-all ${
                          currentTags.includes(tag)
                            ? "border-[#0F2B45] bg-[#0F2B45] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-12">
                  <FormField
                    control={form.control}
                    name="clinical_summary_note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Resumo Clínico</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="text-sm" rows={3} placeholder="Observações gerais, condutas e orientações importantes" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescrição Medicamentosa */}
          <Card className="border border-slate-200 rounded-md shadow-fluent">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 bg-white">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                <Pill size={18} /> Prescrição Medicamentosa
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => appendMed({ name: "", is_critical: false, status: "active" })}
              >
                <Plus className="mr-2 h-3 w-3" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {medFields.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Nenhum medicamento registrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="text-left px-4 py-3">Fármaco</th>
                        <th className="text-left px-4 py-3">Dose</th>
                        <th className="text-left px-4 py-3">Frequência</th>
                        <th className="text-left px-4 py-3">Via</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Crítico</th>
                        <th className="text-right px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medFields.map((field, index) => (
                        <tr key={field.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} className={`${inputCls} font-semibold`} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 w-28">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.dosage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} className={inputCls} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 w-32">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.frequency`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} className={inputCls} placeholder="Ex: 8/8h" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 w-32">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.route`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} className={inputCls} placeholder="VO, EV..." />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 w-32">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.status`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className={inputCls}>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="active">Ativo</SelectItem>
                                      <SelectItem value="paused">Pausado</SelectItem>
                                      <SelectItem value="suspended">Suspenso</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 w-24">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.is_critical`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                  <FormControl>
                                    <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                                  </FormControl>
                                  <FormLabel className="text-xs text-rose-600">Sim</FormLabel>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-slate-300 hover:text-rose-500"
                              onClick={() => removeMed(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Escalas de risco */}
          <Card className="border border-slate-200 rounded-md shadow-fluent">
            <CardHeader className="border-b border-slate-100 pb-3 bg-white">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-700">
                <ChartBar size={18} /> Escalas de Risco
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Braden (LPP)</span>
                  <FormField
                    control={form.control}
                    name="risk_braden"
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input type="number" {...field} className={inputCls} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="h-2 rounded-full bg-rose-100 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, ((form.watch("risk_braden") || 0) / 23) * 100)}%` }} />
                </div>
                <p className="text-[11px] text-slate-500">0 a 23 pontos</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={labelCls}>Morse (Queda)</span>
                  <FormField
                    control={form.control}
                    name="risk_morse"
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input type="number" {...field} className={inputCls} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, ((form.watch("risk_morse") || 0) / 125) * 100)}%` }} />
                </div>
                <p className="text-[11px] text-slate-500">0 a 125 pontos</p>
              </div>
            </CardContent>
          </Card>

          {/* Oxigenoterapia */}
          <Card className="border border-sky-200 bg-sky-50/40 rounded-md shadow-fluent">
            <CardHeader className="border-b border-sky-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-900">
                <Wind size={18} /> Oxigenoterapia
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                control={form.control}
                name="oxygen_usage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                    </FormControl>
                    <FormLabel className="text-sm font-semibold text-slate-700">Paciente faz uso de O2?</FormLabel>
                  </FormItem>
                )}
              />
              {oxygenActive ? (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="oxygen_flow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Fluxo (L/min)</FormLabel>
                        <FormControl>
                          <Input {...field} className={inputCls} placeholder="Ex: 2 L/min" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="oxygen_equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelCls}>Equipamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputCls}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cilindro">Cilindro</SelectItem>
                            <SelectItem value="Concentrador">Concentrador</SelectItem>
                            <SelectItem value="Bipap">Bipap/Cpap</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className="text-[12px] text-slate-500 flex items-center gap-1">
                  <WarningCircle weight="fill" className="text-slate-400" /> Sem oxigenoterapia ativa.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-6 right-8 shadow-2xl z-50">
          <Button type="submit" className="bg-[#D46F5D] text-white shadow-lg hover:bg-[#c05846] px-6 py-4 rounded-full font-bold flex items-center gap-2">
            Salvar Prontuário Clínico
          </Button>
        </div>
      </form>
    </Form>
  );
}
