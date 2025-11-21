import { createClient } from "@/lib/supabase/server";

export async function getPatients() {
  const supabase = await createClient();

  const { data: patients, error } = await supabase
    .from('patients')
    .select(`
      id,
      full_name,
      cpf,
      gender,
      date_of_birth,
      record_status,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }

  return patients;
}