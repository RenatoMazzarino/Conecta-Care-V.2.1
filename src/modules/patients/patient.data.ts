import { createClient } from "@/lib/supabase/server";
import { PatientFinancialProfileDTO, FinancialRecordDTO } from "@/data/definitions/financial";
import { PatientClinicalDTO } from "@/data/definitions/clinical";
import { EmergencyContactDTO, CareTeamMemberDTO } from "@/data/definitions/team";
import { PatientAdministrativeDTO } from "@/data/definitions/administrative";
import { PatientInventoryDTO } from "@/data/definitions/inventory";
import { PatientDocumentDTO } from "@/data/definitions/documents";

// --- DEFINIÇÕES DE TIPOS AUXILIARES ---

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
  allowed_visit_hours?: string | null;
  facade_image_url?: string | null;
  eta_minutes?: number | null;
  geo_lat?: number | null;
  geo_lng?: number | null;
};

export type PatientDomicileRecord = {
  ambulance_access?: string | null;
  team_parking?: string | null;
  night_access_risk?: "Baixo" | "Médio" | "Alto" | null;
  gate_identification?: string | null;
  entry_procedure?: string | null;
  ventilation?: string | null;
  lighting_quality?: string | null;
  noise_level?: string | null;
  bed_type?: string | null;
  mattress_type?: string | null;
  voltage?: string | null;
  backup_power_source?: string | null;
  water_source?: string | null;
  has_wifi?: boolean | null;
  has_smokers?: boolean | null;
  hygiene_conditions?: string | null;
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

// Tipo específico para a lista de próximos plantões (Visualização Rápida)
export type PatientNextShift = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  shift_type: 'day' | 'night' | '24h';
  professional?: {
    full_name: string;
    role: string;
  } | null;
};

// Tipo para Medicamentos (Lidos diretamente do banco)
export type PatientMedicationRecord = {
  id: string;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  is_critical?: boolean | null;
  status?: string | null;
};

// --- TIPO COMPLETO CORRIGIDO (SEM ANY) ---
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
  preferred_language?: string | null;
  status?: string | null;
  created_at?: string | null;
  salutation?: string | null;
  pronouns?: string | null;
  photo_consent?: boolean | null;
  cpf_status?: string | null;
  national_id?: string | null;
  document_validation_method?: string | null;
  mobile_phone?: string | null;
  secondary_phone?: string | null;
  email?: string | null;
  pref_contact_method?: string | null;
  accept_sms?: boolean | null;
  accept_email?: boolean | null;
  block_marketing?: boolean | null;
  
  // Relacionamentos Tipados Corretamente
  contractor?: { id: string; name: string; type: string }[] | null; // O Supabase retorna array em joins 1:N ou N:1 por padrão
  address?: PatientAddressRecord[];
  domicile?: PatientDomicileRecord[];
  household?: PatientHouseholdMember[];
  
  // Módulos Tipados
  financial?: PatientFinancialProfileDTO[];
  clinical?: PatientClinicalDTO[];
  contacts?: EmergencyContactDTO[];
  team?: CareTeamMemberDTO[];
  ledger?: FinancialRecordDTO[];
  administrative?: PatientAdministrativeDTO[];
  inventory?: PatientInventoryDTO[]; // Note: O DTO pode precisar de ajuste se o 'item' vier aninhado
  documents?: PatientDocumentDTO[];
  schedule_settings?: any[];
  
  // Dados Extras
  next_shifts?: PatientNextShift[];
  medications?: PatientMedicationRecord[];
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
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }

  return patients ?? [];
}

export async function getPatientDetails(patientId: string): Promise<FullPatientDetails | null> {
  const supabase = await createClient();
  
  // Busca principal
  // Nota: Adicionei 'patient_medications' que estava faltando na query anterior para preencher o tipo
  const { data, error } = await supabase
    .from("patients")
    .select(`
      *,
      contractor:contractors(id, name, type),
      address:patient_addresses(*),
      domicile:patient_domiciles(*),
      household:patient_household_members(*),
      financial:patient_financial_profiles(*),
      clinical:patient_clinical_profiles(*),
      administrative:patient_administrative_profiles(*),
      schedule_settings:patient_schedule_settings(*),
      documents:patient_documents(*),
      ledger:financial_records(*),
      medications:patient_medications(*)
    `)
    .eq("id", patientId)
    .single();

  if (error) {
    console.error("Erro ao buscar paciente completo:", error);
    return null;
  }

  // Busca separada para contatos (evita depender de FK configurada)
  const { data: contacts } = await supabase
    .from("patient_emergency_contacts")
    .select("*")
    .eq("patient_id", patientId);

  const { data: team } = await supabase
    .from("care_team_members")
    .select(`
      id,
      role,
      is_primary,
      active,
      professional:professional_profiles(full_name, contact_phone)
    `)
    .eq("patient_id", patientId);

  // Inventário com join manual de item
  const { data: inventoryRows } = await supabase
    .from("patient_inventory")
    .select("*")
    .eq("patient_id", patientId);

  let inventory = inventoryRows ?? [];
  const itemIds = Array.from(new Set(inventory.map((row: any) => row.item_id).filter(Boolean)));
  if (itemIds.length > 0) {
    const { data: masterItems } = await supabase
      .from("inventory_items")
      .select("id, name, category, is_trackable, brand")
      .in("id", itemIds);

    const map = new Map((masterItems ?? []).map((m) => [m.id, m]));
    inventory = inventory.map((row: any) => ({ ...row, item: map.get(row.item_id) || null }));
  }

  // Busca separada para os próximos plantões
  const { data: shifts } = await supabase
    .from('shifts')
    .select(`
        id, start_time, end_time, status, shift_type,
        professional:professional_profiles(full_name, role)
    `)
    .eq('patient_id', patientId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5);

  // Cast forçado seguro, pois garantimos a estrutura acima
  return { ...data, contacts: contacts ?? [], team: team ?? [], inventory, next_shifts: shifts || [] } as unknown as FullPatientDetails;
}
