'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientAdministrativeSchema, PatientAdministrativeDTO } from "@/data/definitions/administrative";
import { upsertAdministrativeAction } from "../../actions.upsertAdministrative";
import { FullPatientDetails } from "../../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Briefcase, UserGear, FileText, Clock, Gear, UsersThree, ClipboardText, ShieldCheck } from "@phosphor-icons/react";
import { format } from "date-fns";

// --- HELPER DE DATA ---
// Converte Date | undefined para string "YYYY-MM-DD" para o input HTML
const dateToInput = (d?: Date | string | null) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    return format(d, 'yyyy-MM-dd');
};

export function TabAdministrative({ patient }: { patient: FullPatientDetails }) {
    // Busca os dados administrativos (se existirem) ou inicializa vazio
    // OBS: Lembre-se de atualizar o patient.data.ts para trazer 'administrative'
    const admin = (patient?.administrative as any)?.[0] || {};
    const schedule = (patient as any).schedule_settings?.[0] || {};
    
    // Busca complexidade do perfil clínico (somente leitura ou edição compartilhada)
    const clinical = (patient.clinical?.[0] as any) || {};

    const form = useForm<PatientAdministrativeDTO>({
        resolver: zodResolver(PatientAdministrativeSchema) as any,
        defaultValues: {
            patient_id: patient.id,
            admission_date: admin.admission_date ? new Date(admin.admission_date) : undefined,
            discharge_prediction_date: admin.discharge_prediction_date ? new Date(admin.discharge_prediction_date) : undefined,
            discharge_date: admin.discharge_date ? new Date(admin.discharge_date) : undefined,
            
            admission_type: admin.admission_type ?? 'home_care',
            service_package_name: admin.service_package_name ?? '',
            contract_number: admin.contract_number ?? '',
            contract_status: admin.contract_status ?? 'active',
            
            technical_supervisor_name: admin.technical_supervisor_name ?? '',
            administrative_contact_name: admin.administrative_contact_name ?? '',
            
            scheme_type: schedule.scheme_type ?? '12x36',
            day_start_time: schedule.day_start_time ? schedule.day_start_time.slice(0, 5) : "07:00",
            night_start_time: schedule.night_start_time ? schedule.night_start_time.slice(0, 5) : "19:00",
            professionals_per_shift: schedule.professionals_per_shift ?? 1,
            required_role: schedule.required_role ?? 'technician',
            auto_generate: schedule.auto_generate ?? true,
        }
    });

    async function onSubmit(data: PatientAdministrativeDTO) {
        const res = await upsertAdministrativeAction(data);
        if (res.success) toast.success("Dados administrativos atualizados!");
        else toast.error(res.error);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-12 gap-6 pb-20">
                
                {/* Coluna esquerda - Contrato */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <Card className="bg-white border border-slate-200 border-t-4 border-t-purple-600 rounded-md shadow-fluent">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-purple-800">
                                <Calendar size={18} /> Dados do Contrato & Vigência
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-5">
                            <div className="grid grid-cols-12 gap-4">
                                <FormField control={form.control} name="admission_date" render={({ field }) => (
                                    <FormItem className="col-span-4">
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Admissão</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="h-9 text-sm"
                                                value={dateToInput(field.value)} 
                                                onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="discharge_prediction_date" render={({ field }) => (
                                    <FormItem className="col-span-4">
                                        <FormLabel className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">Prev. Alta</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="h-9 text-sm"
                                                value={dateToInput(field.value)} 
                                                onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="discharge_date" render={({ field }) => (
                                    <FormItem className="col-span-4">
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Alta Efetiva</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="h-9 text-sm"
                                                value={dateToInput(field.value)} 
                                                onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="admission_type" render={({ field }) => (
                                    <FormItem className="col-span-6">
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Tipo de Admissão</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="home_care">Internação Domiciliar (Home Care)</SelectItem>
                                                <SelectItem value="paliativo">Cuidados Paliativos</SelectItem>
                                                <SelectItem value="reabilitacao">Reabilitação Motora/Resp.</SelectItem>
                                                <SelectItem value="procedimento_pontual">Procedimento Pontual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="service_package_name" render={({ field }) => (
                                    <FormItem className="col-span-6">
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Pacote Contratado</FormLabel>
                                        <FormControl><Input {...field} className="h-9 text-sm" placeholder="Ex: Ventilação Mecânica 24h" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="contract_number" render={({ field }) => (
                                    <FormItem className="col-span-6">
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Nº Contrato / ID Externo</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center border rounded-md px-3 bg-slate-50 h-9">
                                                <FileText className="text-slate-400 mr-2"/>
                                                <input {...field} className="flex-1 bg-transparent border-none text-sm outline-none" placeholder="Ex: CTR-2023/999" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="contract_status" render={({ field }) => (
                                    <FormItem className="col-span-6">
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Status do Contrato</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Ativo</SelectItem>
                                                <SelectItem value="suspended">Suspenso</SelectItem>
                                                <SelectItem value="negotiating">Em Negociação</SelectItem>
                                                <SelectItem value="expired">Encerrado / Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Supervisor Técnico</p>
                                    <FormField control={form.control} name="technical_supervisor_name" render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Nome do Enfermeiro/Médico" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Escalista / Administrativo</p>
                                    <FormField control={form.control} name="administrative_contact_name" render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Nome do administrativo" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded border border-slate-100 text-sm">
                                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Sincronização Clínica</p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Complexidade Atual: </span>
                                        <span className="font-bold text-[#0F2B45]">{clinical?.complexity_level?.toUpperCase() || "NÃO DEFINIDA"}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Principal CID: </span>
                                        <span className="font-bold text-[#0F2B45]">{clinical.diagnosis_main || "—"}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">*Dados geridos na aba Clínica.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna direita - Regras Operacionais */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <Card className="bg-white border border-slate-200 border-t-4 border-t-slate-600 rounded-md shadow-fluent">
                        <CardHeader className="border-b border-slate-100 pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-800">
                                <Gear size={18} /> Regras Operacionais (Escala)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <FormField control={form.control} name="scheme_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Modelo de Escala</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="12x36">12x36 (Dia sim/não)</SelectItem>
                                            <SelectItem value="24x48">24x48 (1 dia/2 folga)</SelectItem>
                                            <SelectItem value="daily_12h">Diário 12h (2 turnos)</SelectItem>
                                            <SelectItem value="daily_24h">Diário 24h</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={form.control} name="required_role" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1"><UsersThree size={14} /> Profissional</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="technician">Técnico Enfermagem</SelectItem>
                                                <SelectItem value="nurse">Enfermeiro</SelectItem>
                                                <SelectItem value="caregiver">Cuidador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="professionals_per_shift" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Qtd/Turno</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={5}
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="h-9 text-sm"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={form.control} name="day_start_time" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1"><Clock size={14}/> Início Dia</FormLabel>
                                        <FormControl><Input type="time" {...field} className="h-9 text-sm" /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="night_start_time" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1"><Clock size={14}/> Início Noite</FormLabel>
                                        <FormControl><Input type="time" {...field} className="h-9 text-sm" /></FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="auto_generate" render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                    <FormControl>
                                        <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                                    </FormControl>
                                    <FormLabel className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                        <ShieldCheck weight="fill" className="text-emerald-600" /> Gerar escala automática
                                    </FormLabel>
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>

                <div className="fixed bottom-6 right-8 shadow-2xl z-50">
                    <Button type="submit" className="bg-[#D46F5D] hover:bg-[#c05846] text-white px-6 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg">
                        Salvar Dados Administrativos
                    </Button>
                </div>
            </form>
        </Form>
    );
}
