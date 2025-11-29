'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateShiftSchema, CreateShiftDTO } from "@/data/definitions/schedule";
import { createShiftAction, getSchedulingOptions } from "../actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Plus, Sun, Moon } from "@phosphor-icons/react";

type OptionList = { id: string; full_name: string; role?: string }[];

export function NewShiftDialog() {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<OptionList>([]);
  const [professionals, setProfessionals] = useState<OptionList>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<CreateShiftDTO>({
    resolver: zodResolver(CreateShiftSchema),
    defaultValues: {
      shift_type: 'day',
      service_id: '',
    }
  });

  useEffect(() => {
    if (open && patients.length === 0) {
      setLoadingOptions(true);
      getSchedulingOptions().then(data => {
        setPatients(data.patients);
        const professionalsData = (data.professionals || []) as Array<{ id?: string; user_id?: string; full_name: string; role?: string }>;
        setProfessionals(
          professionalsData.map((p) => ({
            id: p.user_id ?? p.id ?? "",
            full_name: p.full_name,
            role: p.role,
          }))
        );
        setServices(data.services || []);

        if (data.services && data.services.length > 0) {
          form.setValue('service_id', data.services[0].id);
        }
        setLoadingOptions(false);
      });
    }
  }, [open, patients.length, form]);

  async function onSubmit(data: CreateShiftDTO) {
    const res = await createShiftAction(data);
    if (res.success) {
      toast.success("Plantão agendado com sucesso!");
      setOpen(false);
      form.reset();
      if (services.length > 0) {
        form.setValue('service_id', services[0].id);
      }
    } else {
      toast.error("Erro: " + res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#D46F5D] hover:bg-[#D46F5D]/90 text-white gap-2 shadow-fluent">
            <Plus className="h-4 w-4" weight="bold"/> Nova Vaga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#0F2B45]">Novo Agendamento</DialogTitle>
          <DialogDescription>Crie um plantão avulso ou publique uma vaga.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            <FormField control={form.control} name="patient_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder={loadingOptions ? "Carregando..." : "Selecione o paciente"} /></SelectTrigger></FormControl>
                  <SelectContent className="bg-white">
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="service_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço (Faturamento)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o tipo de plantão" /></SelectTrigger></FormControl>
                  <SelectContent className="bg-white">
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input 
                        type="date" 
                        className="bg-white"
                        onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="shift_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno (12h)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-2"
                    >
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="day" id="day" className="peer sr-only" />
                        </FormControl>
                        <FormLabel htmlFor="day" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#0F2B45] peer-data-[state=checked]:text-[#0F2B45] cursor-pointer w-full text-center">
                          <Sun className="mb-1 h-4 w-4" />
                          <span className="text-[10px] font-bold">DIURNO</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="night" id="night" className="peer sr-only" />
                        </FormControl>
                        <FormLabel htmlFor="night" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#0F2B45] peer-data-[state=checked]:text-[#0F2B45] cursor-pointer w-full text-center">
                          <Moon className="mb-1 h-4 w-4" />
                          <span className="text-[10px] font-bold">NOTURNO</span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="professional_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional (Opcional)</FormLabel>
                <Select onValueChange={value => field.onChange(value === 'open_spot' ? undefined : value)} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Deixar em aberto (Vaga)" /></SelectTrigger></FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="open_spot">-- Deixar em Aberto --</SelectItem>
                    {professionals.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} <span className="text-xs text-slate-400">({p.role})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500">Se não selecionar ninguém, a vaga ficará disponível para candidaturas.</p>
              </FormItem>
            )} />

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-[#0F2B45] text-white hover:bg-[#0F2B45]/90 w-full sm:w-auto">
                Confirmar Agendamento
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
