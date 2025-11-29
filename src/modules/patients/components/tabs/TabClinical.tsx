'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientClinicalSchema, PatientClinicalDTO } from "@/data/definitions/clinical";
import { upsertClinicalDataAction } from "@/app/(app)/patients/actions.upsertClinicalData";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heartbeat, Gauge, Wind, Plus, ClipboardText } from "@phosphor-icons/react";

const deviceOptions = ["GTT", "TQT", "SVD", "CVC", "PICC", "Marcapasso"];

const complexityBadge = (level?: string) => {
  const map: any = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-rose-100 text-rose-800",
  };
  return map[level || "low"] || "bg-slate-100 text-slate-700";
};

export function TabClinical({ patient }: { patient: FullPatientDetails }) {
  const clinical: any = patient.clinical?.[0] || {};
  const form = useForm<PatientClinicalDTO>({
    resolver: zodResolver(PatientClinicalSchema) as any,
    defaultValues: {
      patient_id: patient.id,
      cid_main: clinical.cid_main || "",
      complexity_level: clinical.complexity_level || "medium",
      blood_type: clinical.blood_type || "",
      clinical_summary: clinical.clinical_summary || "",
      allergies: clinical.allergies || [],
      devices: clinical.devices || [],
      risk_braden: clinical.risk_braden || 0,
      risk_morse: clinical.risk_morse || 0,
      oxygen_usage: clinical.oxygen_usage || false,
      oxygen_mode: clinical.oxygen_mode || "",
      oxygen_interface: clinical.oxygen_interface || "",
      oxygen_flow: clinical.oxygen_flow || "",
      oxygen_regime: clinical.oxygen_regime || "",
      medications: [], // não exibimos medicações aqui
    },
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [openDevices, setOpenDevices] = useState(false);
  const [openRisk, setOpenRisk] = useState(false);
  const oxygenOn = form.watch("oxygen_usage");
  const devices = form.watch("devices") || [];
  const allergies = form.watch("allergies") || [];

  const addAllergy = () => {
    if (!allergyInput.trim()) return;
    form.setValue("allergies", [...allergies, allergyInput.trim()]);
    setAllergyInput("");
  };
  const removeAllergy = (a: string) => form.setValue("allergies", allergies.filter((x: string) => x !== a));

  const toggleDevice = (d: string) => {
    form.setValue("devices", devices.includes(d) ? devices.filter((x: string) => x !== d) : [...devices, d]);
  };

  const updateRisk = (field: "risk_braden" | "risk_morse", value: number) => {
    form.setValue(field, value);
  };

  async function onSubmit(data: PatientClinicalDTO) {
    const res = await upsertClinicalDataAction(data);
    if (res.success) toast.success("Dados clínicos atualizados!");
    else toast.error(res.error || "Erro ao salvar.");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-16">
        {/* Coluna esquerda */}
        <div className="space-y-6">
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]">
                  <Heartbeat className="w-5 h-5" /> Resumo do Caso
                </CardTitle>
                <Badge className={complexityBadge(form.watch("complexity_level"))}>{form.watch("complexity_level")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="cid_main" render={({ field }) => (
                  <FormItem><FormLabel>CID Principal</FormLabel><FormControl><Input {...field} placeholder="CID ou texto livre" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="complexity_level" render={({ field }) => (
                  <FormItem><FormLabel>Complexidade</FormLabel><FormControl>
                    <select className="w-full h-9 rounded border border-slate-200 px-2 text-sm" value={field.value} onChange={field.onChange}>
                      <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option>
                    </select>
                  </FormControl></FormItem>
                )} />
                <FormField control={form.control} name="blood_type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo Sanguíneo</FormLabel><FormControl><Input {...field} placeholder="A+, O-..." /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="clinical_summary" render={({ field }) => (
                <FormItem><FormLabel>Resumo Clínico</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="Paciente com sequela de AVC..." /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Alergias</FormLabel>
                  <div className="flex gap-2">
                    <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="Nova alergia" className="h-8 w-40 text-sm" />
                    <Button type="button" size="sm" onClick={addAllergy}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allergies.length === 0 && <span className="text-xs text-slate-500">Nenhuma alergia.</span>}
                  {allergies.map((a: string) => (
                    <Badge key={a} className="bg-rose-100 text-rose-700 flex items-center gap-1">
                      {a}
                      <button type="button" onClick={() => removeAllergy(a)}>×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="flex items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><ClipboardText className="w-5 h-5" /> Invasivos e Suporte</CardTitle>
              <Sheet open={openDevices} onOpenChange={setOpenDevices}>
                <SheetTrigger asChild><Button size="sm" variant="outline">Gerenciar Dispositivos</Button></SheetTrigger>
                <SheetContent className="sm:max-w-sm space-y-3">
                  <SheetHeader><SheetTitle>Dispositivos</SheetTitle></SheetHeader>
                  {deviceOptions.map((d) => (
                    <div key={d} className="flex items-center gap-2">
                      <Checkbox checked={devices.includes(d)} onCheckedChange={() => toggleDevice(d)} />
                      <span>{d}</span>
                    </div>
                  ))}
                  <SheetFooter />
                </SheetContent>
              </Sheet>
            </CardHeader>
            <CardContent className="pt-4 flex flex-wrap gap-2">
              {devices.length === 0 && <span className="text-xs text-slate-500">Nenhum dispositivo marcado.</span>}
              {devices.map((d: string) => (
                <Badge key={d} className="bg-emerald-100 text-emerald-700">{d}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="flex items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><Gauge className="w-5 h-5" /> Escalas de Risco</CardTitle>
              <Dialog open={openRisk} onOpenChange={setOpenRisk}>
                <DialogTrigger asChild><Button size="sm" variant="outline">Nova Avaliação</Button></DialogTrigger>
                <DialogContent className="sm:max-w-sm space-y-3">
                  <DialogHeader><DialogTitle>Ajustar Scores</DialogTitle></DialogHeader>
                  <div className="space-y-2">
                    <Label>Braden</Label>
                    <Input type="number" value={form.watch("risk_braden")} onChange={(e)=>updateRisk("risk_braden", Number(e.target.value))} />
                    <Label>Morse</Label>
                    <Input type="number" value={form.watch("risk_morse")} onChange={(e)=>updateRisk("risk_morse", Number(e.target.value))} />
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-3 rounded border border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500">Braden</p>
                <p className="text-lg font-semibold text-slate-800">{form.watch("risk_braden")}</p>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(Number(form.watch("risk_braden")) / 23) * 100}%` }} />
                </div>
              </div>
              <div className="p-3 rounded border border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500">Morse</p>
                <p className="text-lg font-semibold text-slate-800">{form.watch("risk_morse")}</p>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (Number(form.watch("risk_morse")) / 125) * 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-fluent border-slate-200">
            <CardHeader className="flex items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-base text-[#0F2B45]"><Wind className="w-5 h-5" /> Suporte Ventilatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={oxygenOn} onCheckedChange={(v)=>form.setValue("oxygen_usage", !!v)} />
                <span>Paciente em uso de O2?</span>
              </div>
              {oxygenOn && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="oxygen_mode" render={({ field }) => (
                    <FormItem><FormLabel>Modo</FormLabel><FormControl><Input {...field} placeholder="Cilindro/Concentrador" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="oxygen_interface" render={({ field }) => (
                    <FormItem><FormLabel>Interface</FormLabel><FormControl><Input {...field} placeholder="Cateter/Máscara" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="oxygen_flow" render={({ field }) => (
                    <FormItem><FormLabel>Fluxo (L/min)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="oxygen_regime" render={({ field }) => (
                    <FormItem><FormLabel>Regime</FormLabel><FormControl><Input {...field} placeholder="Contínuo/Noturno" /></FormControl></FormItem>
                  )} />
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-[#0F2B45] text-white">Salvar alterações</Button>
        </div>
      </form>
    </Form>
  );
}
