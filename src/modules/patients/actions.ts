'use server'

import { createClient } from "@/lib/supabase/server";
import { CreatePatientSchema, CreatePatientDTO } from "@/data/definitions/patient";
import { redirect } from "next/navigation";

export async function createPatientAction(data: CreatePatientDTO) {
  const supabase = await createClient();

  // 1. Valida os dados no servidor
  const parsed = CreatePatientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }
  const form = parsed.data;

  // 2. Cria o paciente na tabela Mestra (patients)
  const { data: patient, error: errPatient } = await supabase
    .from('patients')
    .insert({
      full_name: form.full_name,
      cpf: form.cpf,
      date_of_birth: form.date_of_birth.toISOString(),
      gender: form.gender,
      record_status: 'active'
    })
    .select('id')
    .single();

  if (errPatient || !patient) {
    console.error("Erro ao criar paciente:", errPatient);
    return { success: false, error: "Erro ao salvar paciente." };
  }

  // 3. Cria os registros satélites (Financeiro e Endereço)
  // Como é V2, vamos inserir o básico para não quebrar o sistema
  await Promise.all([
    supabase.from('patient_financial_profiles').insert({
      patient_id: patient.id,
      bond_type: form.bond_type,
      monthly_fee: form.monthly_fee,
      billing_due_day: form.billing_due_day
    }),
    supabase.from('patient_addresses').insert({
      patient_id: patient.id,
      city: form.city,
      state: form.state,
      // Preenchemos o resto com vazio para não quebrar a constraint NOT NULL
      street: 'Não informado', 
      number: 'S/N',
      neighborhood: 'Não informado',
      zip_code: '00000-000'
    })
  ]);

  // 4. Redireciona para a lista (que criaremos depois)
  redirect('/patients');
}