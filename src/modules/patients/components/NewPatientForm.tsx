'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CreatePatientSchema, CreatePatientDTO } from '@/data/definitions/patient';
import { createPatientAction } from '@/modules/patients/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";
import { useCep } from '@/hooks/use-cep';
import { Spinner, MagnifyingGlass } from '@phosphor-icons/react';

export function NewPatientForm() {
  const router = useRouter();
  const { fetchCep, loading: loadingCep } = useCep();

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const parts = [
      digits.slice(0, 3),
      digits.slice(3, 6),
      digits.slice(6, 9),
      digits.slice(9, 11),
    ];
    return [
      parts[0],
      parts[1] && parts[0] ? `.${parts[1]}` : parts[1],
      parts[2] && parts[1] ? `.${parts[2]}` : parts[2],
      parts[3] && parts[2] ? `-${parts[3]}` : parts[3],
    ]
      .filter(Boolean)
      .join('');
  };

  const form = useForm<CreatePatientDTO>({
    resolver: zodResolver(CreatePatientSchema) as any,
    defaultValues: {
      full_name: '',
      cpf: '',
      monthly_fee: 0,
      billing_due_day: undefined,
      gender: 'Other',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      date_of_birth: undefined as unknown as Date,
      bond_type: 'Particular'
    },
  });

  async function onSubmit(data: CreatePatientDTO) {
    const promise = createPatientAction(data);
    toast.promise(promise, {
      loading: 'Criando prontuário...',
      success: (result) => {
        if (result?.error) throw new Error(result.error);
        setTimeout(() => router.push('/patients'), 1000);
        return `Paciente ${data.full_name} cadastrado!`;
      },
      error: (err) => err.message || "Erro ao criar paciente."
    });
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cepValue = e.target.value;
    if (!cepValue) return;
    const address = await fetchCep(cepValue);
    
    if (address) {
      form.setValue('street', address.street);
      form.setValue('neighborhood', address.neighborhood);
      form.setValue('city', address.city);
      form.setValue('state', address.state);
      document.getElementById('number-input')?.focus();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-[#0F2B45]">Nova Admissão</h1>
                <p className="text-sm text-slate-500">Cadastro inicial simplificado.</p>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white shadow-sm">
                    Salvar Cadastro
                </Button>
            </div>
        </div>

        <Separator />

        <Card className="border border-slate-200 shadow-sm rounded-md">
             <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-[#0F2B45]">Dados Pessoais</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <FormField control={form.control} name="full_name" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Nome Completo</FormLabel><FormControl><Input {...field} className="bg-white h-9" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="cpf" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">CPF</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="000.000.000-00"
                                    value={field.value}
                                    maxLength={14}
                                    onChange={(e) => field.onChange(formatCpf(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Data Nasc.</FormLabel>
                            <FormControl>
                                <Input type="date" className="bg-white h-9" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={(e) => { const d = e.target.value ? new Date(e.target.value) : undefined; field.onChange(d as unknown as Date); }} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Gênero</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="F">Feminino</SelectItem><SelectItem value="M">Masculino</SelectItem><SelectItem value="Other">Outro</SelectItem></SelectContent>
                        </Select>
                    </FormItem>
                )} />
             </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm rounded-md border-l-4 border-l-[#0F2B45]">
            <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-[#0F2B45] flex items-center gap-2">
                    Endereço Residencial
                    {loadingCep && <span className="text-xs font-normal text-slate-500 flex items-center gap-1"><Spinner className="animate-spin"/> Buscando CEP...</span>}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
                
                <div className="md:col-span-3 relative">
                    <FormField control={form.control} name="zip_code" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">CEP</FormLabel>
                            <div className="relative">
                                <FormControl>
                                    <Input 
                                        placeholder="00000-000" 
                                        value={field.value}
                                        onChange={(e) => field.onChange(formatCep(e.target.value))}
                                        onBlur={handleCepBlur} 
                                        maxLength={9}
                                        className="bg-white h-9 pr-8"
                                    />
                                </FormControl>
                                <MagnifyingGlass className="absolute right-2 top-2.5 text-slate-400 h-4 w-4 pointer-events-none" />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="md:col-span-7">
                    <FormField control={form.control} name="street" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Logradouro</FormLabel>
                            <FormControl><Input {...field} placeholder="Rua..." disabled={loadingCep} className="bg-slate-50 h-9" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="md:col-span-2">
                    <FormField control={form.control} name="number" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Número</FormLabel>
                            <FormControl><Input {...field} id="number-input" className="bg-white h-9" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="md:col-span-5">
                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Bairro</FormLabel>
                            <FormControl><Input {...field} disabled={loadingCep} className="bg-slate-50 h-9" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="md:col-span-5">
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Cidade</FormLabel>
                            <FormControl><Input {...field} disabled={loadingCep} className="bg-slate-50 h-9" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="md:col-span-2">
                     <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">UF</FormLabel>
                            <FormControl><Input {...field} maxLength={2} disabled={loadingCep} className="bg-slate-50 h-9" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

            </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm rounded-md bg-slate-50/50">
            <CardHeader className="border-b border-slate-100 pb-3"><CardTitle className="text-base font-bold text-[#0F2B45]">Configuração de Contrato</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <FormField control={form.control} name="bond_type" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Vínculo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-white h-9"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Particular">Particular</SelectItem><SelectItem value="Plano de Saúde">Plano de Saúde</SelectItem><SelectItem value="Convênio">Convênio</SelectItem></SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <FormField control={form.control} name="monthly_fee" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Mensalidade (R$)</FormLabel>
                        <FormControl><Input type="number" {...field} className="bg-white h-9" onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={form.control} name="billing_due_day" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-slate-500">Dia Venc.</FormLabel>
                        <FormControl><Input type="number" min={1} max={31} {...field} className="bg-white h-9" onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    </FormItem>
                )} />
            </CardContent>
        </Card>

      </form>
    </Form>
  );
}
