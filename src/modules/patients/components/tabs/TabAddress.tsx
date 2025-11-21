'use client'

import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientAddressSchema, PatientAddressDTO } from "@/data/definitions/address";
import { upsertAddressAction } from "@/modules/patients/actions.upsertAddress"; 
import { FullPatientDetails } from "@/modules/patients/patient.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    MapPin, House, Truck, Warning, WifiHigh, PawPrint, 
    Bed, Plugs, Drop, Moon
} from "@phosphor-icons/react";

// Helper visual para cabeçalhos de seção
function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/50 px-4 py-3 text-[#0F2B45] font-bold uppercase text-xs tracking-wide rounded-t-md">
            <Icon className="h-4 w-4" />
            {title}
        </div>
    );
}

export function TabAddress({ patient }: { patient: FullPatientDetails }) {
    // Helpers seguros para extrair dados (o array pode vir vazio do banco)
    const address = patient?.address?.[0] || {};
    
    // Tipagem segura para acessar as relações que adicionamos no patient.data.ts
    // (Assumindo que você atualizou o select lá para trazer domicile e household)
    const domicile = (patient as any)?.domicile?.[0] || {};
    
    const form = useForm<PatientAddressDTO>({
        resolver: zodResolver(PatientAddressSchema) as Resolver<PatientAddressDTO>,
        defaultValues: {
            patient_id: patient?.id,
            // Endereço
            zip_code: address.zip_code ?? '',
            street: address.street ?? '',
            number: address.number ?? '',
            neighborhood: address.neighborhood ?? '',
            city: address.city ?? '',
            state: address.state ?? '',
            complement: address.complement ?? '',
            reference_point: address.reference_point ?? '',
            zone_type: address.zone_type ?? 'Urbana',
            travel_notes: address.travel_notes ?? '',
            
            // Logística
            ambulance_access: domicile.ambulance_access ?? 'Sim',
            team_parking: domicile.team_parking ?? '',
            night_access_risk: domicile.night_access_risk ?? 'Baixo',
            entry_procedure: domicile.entry_procedure ?? '',
            
            // Infraestrutura
            bed_type: domicile.bed_type ?? '',
            mattress_type: domicile.mattress_type ?? '',
            voltage: domicile.voltage ?? '',
            backup_power_source: domicile.backup_power_source ?? '',
            water_source: domicile.water_source ?? '',
            has_wifi: domicile.has_wifi ?? false,
            
            // Social / Risco
            has_smokers: domicile.has_smokers ?? false,
            pets_description: domicile.pets_description ?? '',
            animals_behavior: domicile.animals_behavior ?? '',
            general_observations: domicile.general_observations ?? '',
            
            // Membros (Inicialmente vazio na edição para não complicar, pode ser expandido depois)
            household_members: [] 
        }
    });

    async function onSubmit(data: PatientAddressDTO) {
        const promise = upsertAddressAction(data);
        toast.promise(promise, {
            loading: 'Salvando endereço...',
            success: (res) => {
                if (!res.success) throw new Error(res.error);
                return "Endereço e logística atualizados!";
            },
            error: (err) => err.message
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
                
                {/* SEÇÃO 1: LOCALIZAÇÃO (PAD) */}
                <div className="bg-white rounded-md border shadow-sm">
                    <SectionHeader icon={MapPin} title="Localização (PAD)" />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-2">
                            <FormField control={form.control} name="zip_code" render={({ field }) => (
                                <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-8">
                            <FormField control={form.control} name="street" render={({ field }) => (
                                <FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-2">
                            <FormField control={form.control} name="number" render={({ field }) => (
                                <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        
                        <div className="md:col-span-4">
                            <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-4">
                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-2">
                            <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} maxLength={2} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-2">
                            <FormField control={form.control} name="zone_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zona</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Urbana">Urbana</SelectItem>
                                            <SelectItem value="Rural">Rural</SelectItem>
                                            <SelectItem value="Comunidade">Comunidade</SelectItem>
                                            <SelectItem value="Risco">Área de Risco</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>
                        
                        <div className="md:col-span-6">
                            <FormField control={form.control} name="complement" render={({ field }) => (
                                <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-6">
                            <FormField control={form.control} name="reference_point" render={({ field }) => (
                                <FormItem><FormLabel>Ponto de Referência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 2: LOGÍSTICA E ACESSO */}
                <div className="bg-white rounded-md border shadow-sm">
                    <SectionHeader icon={Truck} title="Logística de Acesso" />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4">
                            <FormField control={form.control} name="ambulance_access" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Acesso Ambulância?</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Sim">Sim (Total)</SelectItem>
                                            <SelectItem value="Parcial">Parcial (Sem maca)</SelectItem>
                                            <SelectItem value="Não">Não (Apenas a pé)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-4">
                            <FormField control={form.control} name="team_parking" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estacionamento Equipe</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: Na rua, fácil" /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-4">
                            <FormField control={form.control} name="night_access_risk" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={field.value === 'Alto' ? "text-rose-600 font-bold" : ""}>Risco Noturno</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Baixo">Baixo <Moon className="inline ml-2 w-3 h-3"/></SelectItem>
                                            <SelectItem value="Médio">Médio</SelectItem>
                                            <SelectItem value="Alto">Alto (Periculosidade)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-12">
                            <FormField control={form.control} name="travel_notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas de Viagem (Instruções para a equipe)</FormLabel>
                                    <FormControl><Textarea {...field} placeholder="Ex: Rua sem saída, entrar pela portaria 2..." /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 3: DOMICÍLIO & INFRA */}
                <div className="bg-white rounded-md border shadow-sm">
                    <SectionHeader icon={House} title="Domicílio & Infraestrutura" />
                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                        
                        {/* Linha de Checkboxes */}
                        <div className="md:col-span-12 flex gap-4 flex-wrap">
                            <FormField control={form.control} name="has_wifi" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-slate-50">
                                    <FormControl><Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} /></FormControl>
                                    <FormLabel className="flex items-center gap-2 cursor-pointer"><WifiHigh /> Possui Wi-Fi?</FormLabel>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="has_smokers" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-slate-50">
                                    <FormControl><Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} /></FormControl>
                                    <FormLabel className="flex items-center gap-2 cursor-pointer text-amber-700"><Warning /> Fumantes?</FormLabel>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3">
                            <FormField control={form.control} name="voltage" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex gap-1 items-center"><Plugs /> Voltagem</FormLabel>
                                    <FormControl><Input {...field} placeholder="110v / 220v" /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3">
                            <FormField control={form.control} name="water_source" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex gap-1 items-center"><Drop /> Água</FormLabel>
                                    <FormControl><Input {...field} placeholder="Rede pública" /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-3">
                            <FormField control={form.control} name="bed_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex gap-1 items-center"><Bed /> Tipo Cama</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Comum">Comum</SelectItem>
                                            <SelectItem value="Hospitalar Manual">Hospitalar Manual</SelectItem>
                                            <SelectItem value="Hospitalar Elétrica">Hospitalar Elétrica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                        <div className="md:col-span-6">
                            <FormField control={form.control} name="pets_description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex gap-2 items-center"><PawPrint /> Animais de Estimação</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: 2 Gatos, 1 Cachorro" /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <div className="md:col-span-6">
                            <FormField control={form.control} name="animals_behavior" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comportamento dos Animais</FormLabel>
                                    <FormControl><Input {...field} placeholder="Dóceis / Bravos / Presos" /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                {/* BOTÃO FLUTUANTE */}
                <div className="flex justify-end sticky bottom-4 z-10">
                    <Button type="submit" className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white shadow-lg">
                        Salvar Dados de Endereço
                    </Button>
                </div>
            </form>
        </Form>
    );
}
