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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Briefcase, UserGear, FileText, Clock, Gear, UsersThree } from "@phosphor-icons/react";
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
                
                {/* 1. VIGÊNCIA E DATAS */}
                <Card className="shadow-fluent border-none">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                            <Calendar size={20} /> Vigência do Contrato
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="admission_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Admissão</FormLabel>
                                <FormControl>
                                    <Input type="date" 
                                        value={dateToInput(field.value)} 
                                        onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="discharge_prediction_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-amber-700">Previsão de Alta</FormLabel>
                                <FormControl>
                                    <Input type="date" 
                                        value={dateToInput(field.value)} 
                                        onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="contract_status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status do Contrato</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                    </CardContent>
                </Card>

                {/* 2. CLASSIFICAÇÃO E PACOTE */}
                <Card className="shadow-fluent border-none">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                            <Briefcase size={20} /> Classificação de Serviço
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="admission_type" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Admissão</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                            <FormItem>
                                <FormLabel>Pacote Contratado (Descritivo)</FormLabel>
                                <FormControl><Input {...field} placeholder="Ex: Pacote Ventilação Mecânica 24h" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="md:col-span-2 p-4 bg-slate-50 rounded border border-slate-100">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Sincronização Clínica</p>
                            <div className="flex gap-4 text-sm">
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

                {/* 3. GESTÃO E EQUIPE */}
                <Card className="shadow-fluent border-none">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                            <UserGear size={20} /> Gestão da Conta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="contract_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nº do Contrato / ID Externo</FormLabel>
                                <FormControl>
                                    <div className="flex items-center border rounded-md px-3 bg-slate-50">
                                        <FileText className="text-slate-400 mr-2"/>
                                        <input {...field} className="flex-1 bg-transparent border-none h-10 text-sm outline-none" placeholder="Ex: CTR-2023/999" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <FormField control={form.control} name="technical_supervisor_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supervisor Técnico Resp.</FormLabel>
                                    <FormControl><Input {...field} placeholder="Nome do Enfermeiro/Médico" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="administrative_contact_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Escalista / Concierge</FormLabel>
                                    <FormControl><Input {...field} placeholder="Nome do administrativo" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. REGRAS OPERACIONAIS DE ESCALA */}
                <Card className="shadow-fluent border-none border-l-4 border-l-emerald-500">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#0F2B45]">
                            <Gear size={20} /> Regras Operacionais (Escala)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <FormField control={form.control} name="scheme_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modelo de Escala</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                        </div>

                        <div className="md:col-span-1">
                            <FormField control={form.control} name="required_role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><UsersThree size={16} /> Profissional Exigido</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="technician">Técnico Enfermagem</SelectItem>
                                            <SelectItem value="nurse">Enfermeiro</SelectItem>
                                            <SelectItem value="caregiver">Cuidador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-1">
                            <FormField control={form.control} name="professionals_per_shift" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qtd. Profissionais/Turno</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5}
                                            {...field}
                                            onChange={e => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3 grid grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                            <FormField control={form.control} name="day_start_time" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Clock size={16}/> Início Diurno</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="night_start_time" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2 text-slate-500"><Clock size={16}/> Início Noturno</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end sticky bottom-4 z-10">
                    <Button type="submit" className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white shadow-lg">
                        Salvar Dados Administrativos
                    </Button>
                </div>
            </form>
        </Form>
    );
}
