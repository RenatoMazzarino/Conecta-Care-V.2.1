'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientPersonalSchema, PatientPersonalDTO } from "@/data/definitions/personal";
import { upsertPersonalAction } from "../actions.upsertPersonal";
import { FullPatientDetails } from "../patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { UserCircle, IdentificationBadge, FloppyDisk } from "@phosphor-icons/react";
import { format } from "date-fns";

// Helper visual baseado no seu design system antigo
function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 text-[#0F2B45] font-bold uppercase text-sm tracking-wide">
            <Icon className="h-5 w-5" />
            {title}
        </div>
    );
}

export function TabPersonal({ patient }: { patient: FullPatientDetails }) {
    const form = useForm<PatientPersonalDTO>({
        resolver: zodResolver(PatientPersonalSchema),
        defaultValues: {
            patient_id: patient?.id,
            full_name: patient?.full_name ?? '',
            social_name: patient?.social_name ?? '',
            cpf: patient?.cpf ?? '',
            rg: patient?.rg ?? '',
            rg_issuer: patient?.rg_issuer ?? '',
            cns: patient?.cns ?? '',
            date_of_birth: patient?.date_of_birth ? new Date(patient.date_of_birth) : undefined,
            gender: (patient?.gender as any) ?? 'Other',
            mother_name: patient?.mother_name ?? '',
            civil_status: patient?.civil_status ?? '',
            nationality: patient?.nationality ?? 'Brasileira',
            place_of_birth: patient?.place_of_birth ?? '',
        }
    });

    async function onSubmit(data: PatientPersonalDTO) {
        const res = await upsertPersonalAction(data);
        if (res.success) {
            toast.success("Dados pessoais atualizados!");
        } else {
            toast.error("Erro ao salvar: " + res.error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* SEÇÃO 1: IDENTIDADE */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <SectionHeader icon={UserCircle} title="Identidade e Perfil Social" />
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        <div className="md:col-span-6">
                            <FormField control={form.control} name="full_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Civil Completo</FormLabel>
                                    <FormControl><Input {...field} className="font-semibold" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-6">
                            <FormField control={form.control} name="social_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Social / Display</FormLabel>
                                    <FormControl><Input {...field} placeholder="Como prefere ser chamado" /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3">
                            <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data de Nascimento</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="date" 
                                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3">
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sexo Biológico</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="M">Masculino</SelectItem>
                                            <SelectItem value="F">Feminino</SelectItem>
                                            <SelectItem value="Other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-6">
                            <FormField control={form.control} name="mother_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Mãe</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-4">
                            <FormField control={form.control} name="nationality" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nacionalidade</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        
                        <div className="md:col-span-4">
                            <FormField control={form.control} name="place_of_birth" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Naturalidade</FormLabel>
                                    <FormControl><Input {...field} placeholder="Cidade/UF" /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-4">
                            <FormField control={form.control} name="civil_status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado Civil</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                                            <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                            <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                                            <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 2: DOCUMENTAÇÃO */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <SectionHeader icon={IdentificationBadge} title="Documentação Civil" />
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-3">
                            <FormField control={form.control} name="cpf" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF</FormLabel>
                                    <FormControl><Input {...field} className="bg-slate-50" readOnly /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3">
                            <FormField control={form.control} name="rg" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RG</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-2">
                            <FormField control={form.control} name="rg_issuer" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Órgão Emissor</FormLabel>
                                    <FormControl><Input {...field} placeholder="SSP/SP" /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-4">
                            <FormField control={form.control} name="cns" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cartão SUS (CNS)</FormLabel>
                                    <FormControl><Input {...field} className="font-mono text-blue-900 bg-blue-50/50 border-blue-100" /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                {/* BOTÃO DE SALVAR FLUTUANTE OU FIXO */}
                <div className="flex justify-end gap-4 sticky bottom-4 z-10">
                    <Button type="submit" className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white shadow-lg gap-2">
                        <FloppyDisk className="h-5 w-5" />
                        Salvar Alterações
                    </Button>
                </div>

            </form>
        </Form>
    );
}