import { createClient } from "@/lib/supabase/server";

// --- DEFINIÇÕES DE TIPOS (Para evitar 'any' nos componentes) ---

export type PatientAddressRecord = {
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  reference_point?: string | null;
  zone_type?: "Urbana" | "Rural" | "Comunidade" | "Risco" | null;
  travel_notes?: string | null;
};

export type PatientDomicileRecord = {
  ambulance_access?: string | null;
  team_parking?: string | null;
  night_access_risk?: "Baixo" | "Médio" | "Alto" | null;
  entry_procedure?: string | null;
  bed_type?: string | null;
  mattress_type?: string | null;
  voltage?: string | null;
  backup_power_source?: string | null;
  water_source?: string | null;
  has_wifi?: boolean | null;
  has_smokers?: boolean | null;
  pets_description?: string | null;
  animals_behavior?: string | null;
  general_observations?: string | null;
};

export type PatientHouseholdMember = {
  id?: string;
  name?: string;
  role?: string;
  type?: "resident" | "caregiver";
  schedule_note?: string | null;
};

// Tipo completo para a Visão 360º
export type FullPatientDetails = {
  id: string;
  full_name: string;
  social_name?: string | null;
  cpf?: string | null;
  rg?: string | null;
  rg_issuer?: string | null;
  cns?: string | null;
  date_of_birth?: string | null;
  gender?: "M" | "F" | "Other" | null;
  gender_identity?: string | null;
  mother_name?: string | null;
  civil_status?: string | null;
  nationality?: string | null;
  place_of_birth?: string | null;
  status?: string | null; // CORRIGIDO: de record_status para status
  created_at?: string | null;
  
  // Relacionamentos
  contractor?: { id: string; name: string; type: string } | null;
  address?: PatientAddressRecord[];
  domicile?: PatientDomicileRecord[];
  household?: PatientHouseholdMember[];
  financial?: any[]; // Tiparemos melhor depois se precisar
  clinical?: any[];
  contacts?: any[];
  medications?: any[];
};

type PatientListItem = Pick<
  FullPatientDetails,
  "id" | "full_name" | "cpf" | "gender" | "date_of_birth" | "status" | "created_at"
>;

// --- FUNÇÕES DE BUSCA ---

export async function getPatients(): Promise<PatientListItem[]> {
  const supabase = await createClient();

  const { data: patients, error } = await supabase
    .from("patients")
    .select(`
      id,
      full_name,
      cpf,
      gender,
      date_of_birth,
      status, 
      created_at
    `) // ^^^ CORRIGIDO: status ao invés de record_status
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }

  return patients ?? [];
}

export async function getPatientDetails(patientId: string): Promise<FullPatientDetails | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("patients")
    .select(`
      *,
      contractor:contractors(id, name, type),
      address:patient_addresses(*),
      domicile:patient_domiciles(*),
      household:patient_household_members(*),
      financial:patient_financial_profiles(*),
      clinical:patient_clinical_profiles(*)
      ,
      medications:patient_medications(*)
    `)
    .eq("id", patientId)
    .single();

  if (error) {
    console.error("Erro ao buscar paciente completo:", error);
    return null;
  }

  return data as FullPatientDetails;
}
