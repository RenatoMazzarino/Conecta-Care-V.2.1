'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { upsertAddressWizardAction } from "@/app/(app)/patients/new/actions";
import { createClient } from "@/lib/supabase/client";

const AddressSchema = z.object({
  patient_id: z.string().uuid(),
  zip_code: z.string().min(8, "CEP inválido"),
  street: z.string().min(2, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida"),
});

type AddressFormValues = z.infer<typeof AddressSchema>;

type StepAddressProps = {
  patientId?: string | null;
  onComplete: () => void;
};

export function StepAddress({ patientId, onComplete }: StepAddressProps) {
  const toast = useToast();
  const supabase = createClient();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      patient_id: patientId || "",
      zip_code: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (patientId) form.setValue("patient_id", patientId);
  }, [patientId, form]);

  useEffect(() => {
    const loadAddress = async () => {
      if (!patientId) return;
      const { data } = await supabase
        .from("patient_addresses")
        .select("zip_code, street, number, neighborhood, city, state")
        .eq("patient_id", patientId)
        .maybeSingle();
      if (data) {
        form.reset({
          patient_id: patientId,
          zip_code: data.zip_code || "",
          street: data.street || "",
          number: data.number || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
        });
      }
    };
    loadAddress();
  }, [patientId, supabase, form]);

  const onSubmit = async (values: AddressFormValues) => {
    if (!patientId) {
      toast.error("Finalize o Passo 1 antes de continuar.");
      return;
    }
    const res = await upsertAddressWizardAction(values);
    if (!res.success) {
      toast.error(res.error || "Erro ao salvar endereço");
      return;
    }
    toast.success("Endereço salvo");
    onComplete();
  };

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg text-[#0F2B45]">Passo 2: Localização</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="zip_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rua</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="neighborhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Bairro" {...field} />
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
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="SP" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" className="bg-[#0F2B45] text-white">
                Salvar e Avançar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
