'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { finalizeWizardAction } from "@/app/(app)/patients/new/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type StepReviewProps = {
  patientId?: string | null;
  onBack?: () => void;
};

export function StepReview({ patientId, onBack }: StepReviewProps) {
  const toast = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      const [{ data: p }, { data: a }, { data: f }] = await Promise.all([
        supabase.from("patients").select("full_name, cpf, gender, date_of_birth, status").eq("id", patientId).maybeSingle(),
        supabase.from("patient_addresses").select("zip_code, street, number, neighborhood, city, state").eq("patient_id", patientId).maybeSingle(),
        supabase.from("patient_financial_profiles").select("bond_type, insurance_card_number, insurance_card_validity, insurer_name").eq("patient_id", patientId).maybeSingle(),
      ]);
      setPersonal(p);
      setAddress(a);
      setFinancial(f);
    };
    load();
  }, [patientId, supabase]);

  const handleFinish = async () => {
    if (!patientId) {
      toast.error("Finalize os passos anteriores.");
      return;
    }
    setLoading(true);
    const hasFinancial = !!financial?.bond_type;
    const res = await finalizeWizardAction(patientId, hasFinancial);
    setLoading(false);
    if (!res.success) {
      toast.error(res.error || "Erro ao finalizar admissão");
      return;
    }
    toast.success("Admissão concluída");
    router.push(`/patients/${patientId}`);
  };

  return (
    <Card className="shadow-fluent border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[#0F2B45]">Passo 4: Revisão & Ativação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 bg-white border border-slate-100 rounded-md p-6">
        <Section title="Identificação" data={personal} fallback="Preencha o Passo 1" />
        <Section title="Endereço" data={address} fallback="Preencha o Passo 2" />
        <Section title="Financeiro" data={financial} fallback="Passo 3 opcional" />

        <div className="flex justify-between border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={handleFinish} disabled={loading} className="bg-[#0F2B45] text-white">
            {loading ? "Finalizando..." : "Finalizar Admissão"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, data, fallback }: { title: string; data: any; fallback: string }) {
  if (!data) {
    return (
      <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        {fallback}
      </div>
    );
  }
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase text-slate-500 mb-1">{title}</p>
      <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
