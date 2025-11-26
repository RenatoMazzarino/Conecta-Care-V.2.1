'use client';

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { upsertFinancialWizardAction } from "@/app/(app)/patients/new/actions";
import { createClient } from "@/lib/supabase/client";
import { PatientFinancialProfileSchema } from "@/data/definitions/financial";

const FinancialSchema = PatientFinancialProfileSchema.pick({
  patient_id: true,
  bond_type: true,
  insurance_card_number: true,
  insurance_card_validity: true,
  insurer_name: true,
});

type FinancialFormValues = z.infer<typeof FinancialSchema>;

type StepFinancialProps = {
  patientId?: string | null;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
};

export function StepFinancial({ patientId, onComplete, onSkip, onBack }: StepFinancialProps) {
  const toast = useToast();
  const supabase = createClient();

  const form = useForm<FinancialFormValues>({
    resolver: zodResolver(FinancialSchema) as any,
    defaultValues: {
      patient_id: patientId || "",
      bond_type: "Particular",
      insurance_card_number: "",
      insurance_card_validity: undefined,
      insurer_name: "",
    },
  });

  useEffect(() => {
    if (patientId) form.setValue("patient_id", patientId);
  }, [patientId, form]);

  useEffect(() => {
    const loadFinancial = async () => {
      if (!patientId) return;
      const { data } = await supabase
        .from("patient_financial_profiles")
        .select("bond_type, insurance_card_number, insurance_card_validity, insurer_name")
        .eq("patient_id", patientId)
        .maybeSingle();
      if (data) {
        form.reset({
          patient_id: patientId,
          bond_type: (data.bond_type as any) || "Particular",
          insurance_card_number: data.insurance_card_number || "",
          insurance_card_validity: data.insurance_card_validity
            ? new Date(data.insurance_card_validity)
            : undefined,
          insurer_name: data.insurer_name || "",
        });
      }
    };
    loadFinancial();
  }, [patientId, supabase, form]);

  const onSubmit = async (values: FinancialFormValues) => {
    if (!patientId) {
      toast.error("Finalize o Passo 1 antes de continuar.");
      return;
    }
    const res = await upsertFinancialWizardAction(values);
    if (!res.success) {
      toast.error(res.error || "Erro ao salvar financeiro");
      return;
    }
    toast.success("Dados financeiros salvos");
    onComplete();
  };

  return (
    <Card className="shadow-fluent border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#0F2B45]">Passo 3: Vínculo Financeiro</CardTitle>
        <CardDescription className="text-slate-500">Defina vínculo e carteirinha. Pode pular se ainda não souber.</CardDescription>
      </CardHeader>
      <CardContent className="bg-white border border-slate-100 rounded-md p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            <FormField
              control={form.control}
              name="bond_type"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FormLabel>Plano</FormLabel>
                  <FormControl>
                    <Input placeholder="Particular / Convênio" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurer_name"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FormLabel>Operadora</FormLabel>
                  <FormControl>
                    <Input placeholder="Unimed, Bradesco..." {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurance_card_number"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FormLabel>Carteirinha</FormLabel>
                  <FormControl>
                    <Input placeholder="Número da carteirinha" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurance_card_validity"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-6 lg:col-span-4">
                  <FormLabel>Validade</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value as unknown as string).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="col-span-12 flex justify-between border-t border-slate-100 pt-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Voltar
                </Button>
                <Button type="button" variant="outline" onClick={onSkip}>
                  Pular / Definir Depois
                </Button>
              </div>
              <Button type="submit" className="bg-[#0F2B45] text-white px-6">
                Salvar e Avançar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
