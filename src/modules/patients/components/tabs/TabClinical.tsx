'use client';

import { useFieldArray, useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientClinicalSchema, PatientClinicalDTO } from "@/data/definitions/clinical";
import { upsertClinicalAction } from "@/modules/patients/actions.upsertClinical";
import { FullPatientDetails } from "@/modules/patients/patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Stethoscope, Heartbeat, Pill, Plus, Trash, Wind, ChartBar } from "@phosphor-icons/react";

type TabClinicalProps = { patient: FullPatientDetails };

const GaugeCard = ({ title, value, max, colorClass }: { title: string; value?: number; max: number; colorClass: string }) => {
  const percent = value ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-end justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <span className={`text-2xl font-bold ${colorClass}`}>{value ?? "-"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${colorClass.replace("text-", "bg-")}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export function TabClinical({ patient }: TabClinicalProps) {
  const clinical = patient.clinical?.[0] || {};
  const medicationsList = (patient as any)?.medications || [];

  const form = useForm<PatientClinicalDTO>({
    resolver: zodResolver(PatientClinicalSchema) as Resolver<PatientClinicalDTO>,
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
      medications: medicationsList.map((m: any) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        is_critical: m.is_critical,
        status: m.status,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <Card className="border-none shadow-fluent">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
              <Stethoscope size={20} /> Diagnóstico & Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <FormField
                control={form.control}
                name="diagnosis_main"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico Principal (CID)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Sequela de AVC (I69.3)" className="font-semibold" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-4">
              <FormField
                control={form.control}
                name="complexity_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Complexidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

            <div className="md:col-span-12">
              <FormLabel className="mb-3 block">Dispositivos em Uso</FormLabel>
              <div className="flex flex-wrap gap-4">
                {["GTT", "TQT", "SVD", "Cadeirante", "Acamado"].map((tag) => (
                  <div
                    key={tag}
                    onClick={() => toggleTag(tag, currentTags)}
                    className={`cursor-pointer rounded-md border px-4 py-2 text-sm font-semibold transition-all ${
                      currentTags.includes(tag)
                        ? "border-[#0F2B45] bg-[#0F2B45] text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-fluent">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
              <ChartBar size={20} /> Escalas de Risco
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="risk_braden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escala Braden (LPP)</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Input type="number" {...field} className="w-24" />
                      </FormControl>
                      <span className="text-xs text-slate-500">0 a 23 pontos</span>
                    </div>
                  </FormItem>
                )}
              />
              <GaugeCard title="Risco LPP" value={form.watch("risk_braden")} max={23} colorClass="text-emerald-600" />
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="risk_morse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escala Morse (Queda)</FormLabel>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Input type="number" {...field} className="w-24" />
                      </FormControl>
                      <span className="text-xs text-slate-500">0 a 125 pontos</span>
                    </div>
                  </FormItem>
                )}
              />
              <GaugeCard title="Risco Queda" value={form.watch("risk_morse")} max={125} colorClass="text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-sky-50/30 shadow-fluent">
          <CardHeader className="border-b border-sky-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-900">
              <Wind size={20} /> Oxigenoterapia
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-12">
            <div className="md:col-span-12">
              <FormField
                control={form.control}
                name="oxygen_usage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-semibold">Paciente faz uso de O2?</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {oxygenActive && (
              <>
                <div className="md:col-span-6">
                  <FormField
                    control={form.control}
                    name="oxygen_flow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fluxo (L/min)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 2 L/min" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-6">
                  <FormField
                    control={form.control}
                    name="oxygen_equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-fluent">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
              <Pill size={20} /> Prescrição Medicamentosa
            </CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => appendMed({ name: "", is_critical: false, status: "active" })}
            >
              <Plus className="mr-2 h-3 w-3" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {medFields.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Nenhum medicamento registrado.</p>
            ) : (
              medFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col items-end gap-3 border-b border-slate-50 pb-4 last:border-0 md:flex-row"
                >
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Nome do Fármaco</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-24">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Dose</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-32">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.frequency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Frequência</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: 8/8h" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-3">
                    <FormField
                      control={form.control}
                      name={`medications.${index}.is_critical`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-xs font-bold text-rose-600">Crítico</FormLabel>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-rose-500"
                      onClick={() => removeMed(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button type="submit" className="bg-[#D46F5D] text-white shadow-lg hover:bg-[#D46F5D]/90">
            Salvar Prontuário Clínico
          </Button>
        </div>
      </form>
    </Form>
  );
}
