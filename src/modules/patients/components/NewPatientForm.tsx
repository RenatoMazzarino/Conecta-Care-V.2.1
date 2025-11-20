'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePatientSchema, CreatePatientDTO } from '@/data/definitions/patient';
import { createPatientAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export function NewPatientForm() {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(CreatePatientSchema),
    defaultValues: {
      full_name: '',
      cpf: '',
      monthly_fee: 0,
      billing_due_day: undefined, // Importante definir como undefined explicitamente
      gender: 'Other',
      city: '',
      state: '',
      bond_type: 'Particular',
      // Data começa undefined. Fazemos cast via unknown para evitar 'any'
      date_of_birth: undefined as unknown as Date,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nome */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input placeholder="Nome do paciente" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            {/* CPF */}
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            {/* DATA DE NASCIMENTO (Correção dos Erros 1 e 2) */}
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                        <Input 
                            type="date"
                            // Tradutor 1: Zod (Date) -> HTML (String YYYY-MM-DD)
                            value={field.value ? new Date(field.value as unknown as Date).toISOString().split('T')[0] : ''}
                            
                            // Tradutor 2: HTML (String) -> Zod (Date)
                            onChange={(e) => {
                                const val = e.target.value;
                                const date = val ? new Date(val) : undefined;
                                // Cast via unknown -> Date para satisfazer o typing sem usar `any`.
                                field.onChange(date as unknown as Date);
                            }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            {/* Gênero */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                            <SelectItem value="Other">Outro</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos Financeiros (Correção dos Erros 3 e 4: String -> Number) */}
            <FormField
                control={form.control}
                name="monthly_fee"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor Mensal (R$)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="0.00"
                                // Importante: O {...field} sobrescreve onChange, então passamos value e onChange manualmente
                                value={(field.value as unknown as number) ?? 0}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="billing_due_day"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dia Vencimento</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="Ex: 10"
                                value={field.value ? String(field.value as unknown as number) : ''}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl><Input placeholder="Cidade" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl><Input placeholder="SP" maxLength={2} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
            </Button>
            <Button type="submit" className="bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90">
                Salvar Paciente
            </Button>
        </div>
      </form>
    </Form>
  );
}