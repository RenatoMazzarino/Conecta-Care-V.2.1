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
import { MapPin, House, Truck, Warning, WifiHigh, PawPrint, Bed, Plugs, Drop, Moon, Key } from "@phosphor-icons/react";

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="pb-20">
                <div className="grid grid-cols-12 gap-6">
                    {/* COLUNA ESQUERDA */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* Mapa + Endereço */}
                        <div className="bg-white border border-slate-200 rounded-md shadow-fluent">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 text-[#0F2B45] font-bold uppercase text-xs tracking-wide">
                                <MapPin className="h-4 w-4" /> Localização (PAD)
                            </div>
                            <div className="p-5 grid grid-cols-12 gap-4">
                                <div className="col-span-12">
                                    <div className="h-40 bg-slate-100 rounded-md border border-slate-200 relative flex items-center justify-center text-slate-400 text-sm font-semibold">
                                        <span>Mapa / Street View</span>
                                        <button type="button" className="absolute bottom-2 right-2 text-xs font-semibold text-[#0F2B45] bg-white border border-slate-200 rounded px-3 py-1 shadow-sm">
                                            Ver no mapa
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-3">
                                    <FormField control={form.control} name="zip_code" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">CEP</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="col-span-7">
                                    <FormField control={form.control} name="street" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Logradouro</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="col-span-2">
                                    <FormField control={form.control} name="number" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Número</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>

                                <div className="col-span-4">
                                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Bairro</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="col-span-4">
                                    <FormField control={form.control} name="city" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Cidade</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="col-span-2">
                                    <FormField control={form.control} name="state" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">UF</FormLabel><FormControl><Input {...field} maxLength={2} className="h-9 text-sm uppercase" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="col-span-2">
                                    <FormField control={form.control} name="zone_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Zona</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
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

                                <div className="col-span-6">
                                    <FormField control={form.control} name="complement" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Complemento</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl></FormItem>
                                    )} />
                                </div>
                                <div className="col-span-6">
                                    <FormField control={form.control} name="reference_point" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Ponto de Referência</FormLabel><FormControl><Input {...field} className="h-9 text-sm" /></FormControl></FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>

                        {/* Logística */}
                        <div className="bg-white border border-slate-200 rounded-md shadow-fluent">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 text-[#0F2B45] font-bold uppercase text-xs tracking-wide">
                                <Truck className="h-4 w-4" /> Logística de Acesso
                            </div>
                            <div className="p-5 grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-4">
                                    <FormField control={form.control} name="ambulance_access" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Acesso Ambulância?</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Sim">Sim (Total)</SelectItem>
                                                    <SelectItem value="Parcial">Parcial (Sem maca)</SelectItem>
                                                    <SelectItem value="Não">Não (A pé)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <FormField control={form.control} name="team_parking" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Estacionamento Equipe</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Ex: Na rua, fácil" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <FormField control={form.control} name="night_access_risk" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={`text-xs font-bold uppercase ${field.value === 'Alto' ? "text-rose-600" : "text-slate-500"}`}>Risco Noturno</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Baixo">Baixo <Moon className="inline ml-2 w-3 h-3" /></SelectItem>
                                                    <SelectItem value="Médio">Médio</SelectItem>
                                                    <SelectItem value="Alto">Alto (Periculosidade)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <FormField control={form.control} name="entry_procedure" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><Key className="h-4 w-4" /> Procedimento de Entrada</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Portaria, senha, contato..." /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="col-span-12">
                                    <FormField control={form.control} name="travel_notes" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Notas de Viagem (Instruções para a equipe)</FormLabel>
                                            <FormControl><Textarea {...field} className="text-sm" placeholder="Ex: Rua sem saída, entrar pela portaria 2..." /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 border-t-4 border-t-amber-400 rounded-md shadow-fluent">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 text-[#0F2B45] font-bold uppercase text-xs tracking-wide">
                                <House className="h-4 w-4" /> Domicílio & Infraestrutura
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <FormField control={form.control} name="has_wifi" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                            <FormControl>
                                                <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                                            </FormControl>
                                            <FormLabel className="text-xs font-semibold flex items-center gap-1"><WifiHigh /> Wi-Fi</FormLabel>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="has_smokers" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                            <FormControl>
                                                <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                                            </FormControl>
                                            <FormLabel className="text-xs font-semibold text-amber-700 flex items-center gap-1"><Warning /> Fumantes</FormLabel>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField control={form.control} name="voltage" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500 flex gap-1 items-center"><Plugs /> Voltagem</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="110v / 220v" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="water_source" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500 flex gap-1 items-center"><Drop /> Água</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Rede pública" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="backup_power_source" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Fonte Reserva</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Gerador, nobreak..." /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="mattress_type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Colchão</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Pneumático, visco..." /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="bed_type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-slate-500 flex gap-2 items-center"><Bed /> Tipo de Cama</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Comum">Comum</SelectItem>
                                                <SelectItem value="Hospitalar Manual">Hospitalar Manual</SelectItem>
                                                <SelectItem value="Hospitalar Elétrica">Hospitalar Elétrica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField control={form.control} name="pets_description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500 flex gap-2 items-center"><PawPrint /> Animais</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="2 gatos, 1 cão" /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="animals_behavior" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Comportamento</FormLabel>
                                            <FormControl><Input {...field} className="h-9 text-sm" placeholder="Dóceis / Bravos" /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="general_observations" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Observações Gerais</FormLabel>
                                        <FormControl><Textarea {...field} className="text-sm" placeholder="Ex: Portão pesado, campainha não funciona..." /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTÃO FLUTUANTE */}
                <div className="fixed bottom-6 right-8 shadow-2xl z-50">
                    <Button type="submit" className="bg-[#D46F5D] hover:bg-[#c05846] text-white px-6 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg">
                        Salvar Dados de Endereço
                    </Button>
                </div>
            </form>
        </Form>
    );
}
