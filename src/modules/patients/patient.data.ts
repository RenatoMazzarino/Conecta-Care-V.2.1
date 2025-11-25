import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";
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
  schedule_settings?: unknown[];
  
  // Dados Extras
  next_shifts?: PatientNextShift[];
  medications?: PatientMedicationRecord[];
};

type PatientListItem = Pick<
  FullPatientDetails,
  "id" | "full_name" | "cpf" | "gender" | "date_of_birth" | "status" | "created_at"
>;

// --- TIPO PARA A LISTAGEM (DATA GRID) ---
export type PatientGridItem = {
  id: string;
  full_name: string;
  social_name?: string | null;
  age: number | null;
  city?: string;
  neighborhood?: string | null;
  zone_type?: string | null;
  gender?: string | null;
  status: string;
  complexity_level: 'low' | 'medium' | 'high' | 'critical' | null;
  diagnosis_main?: string | null;
  contractor_name?: string;
  billing_status: string;
  next_shift?: {
    date: string;
    professional_name?: string;
    is_open: boolean;
  } | null;
  supervisor_name?: string | null;
  admission_type?: string | null;
  clinical_tags?: string[];
};

export type GetPatientsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  complexity?: string;
  billingStatus?: string;
  contractorId?: string;
  city?: string;
  neighborhood?: string;
  zoneType?: string;
  diagnosis?: string;
  admissionType?: string;
  supervisor?: string;
  clinicalTag?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  bondType?: string;
  paymentMethod?: string;
  contractStatus?: string;
  riskBradenMin?: number;
  riskBradenMax?: number;
  riskMorseMin?: number;
  riskMorseMax?: number;
  oxygenUsage?: string;
};

type GridPatientRow = {
  id: string;
  full_name: string;
  social_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  status?: string | null;
  address?: PatientAddressRecord[];
  clinical?: Array<{
    complexity_level?: "low" | "medium" | "high" | "critical" | null;
    diagnosis_main?: string | null;
    clinical_tags?: string[];
    risk_braden?: number | null;
    risk_morse?: number | null;
    oxygen_usage?: boolean | null;
  }>;
  contractor?: Array<{ id?: string; name?: string | null }> | null;
  financial?: Array<{ billing_status?: string | null; bond_type?: string | null; payment_method?: string | null }>;
  administrative?: Array<{ admission_type?: string | null; technical_supervisor_name?: string | null; contract_status?: string | null }>;
  shifts?: Array<{ start_time: string; professional_id?: string | null }>;
};

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

// Busca paginada com joins para grid
export async function getPatientsPaginated(params: GetPatientsParams = {}) {
  const supabase = await createClient();
  const {
    page = 1,
    pageSize = 20,
    search,
    status,
    complexity,
    billingStatus,
    contractorId,
    city,
    neighborhood,
    zoneType,
    diagnosis,
    admissionType,
    supervisor,
    clinicalTag,
    gender,
    ageMin,
    ageMax,
    bondType,
    paymentMethod,
    contractStatus,
    riskBradenMin,
    riskBradenMax,
    riskMorseMin,
    riskMorseMax,
    oxygenUsage
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("patients")
    .select(`
      id, full_name, social_name, date_of_birth, status, gender,
      contractor:contractors(id, name),
      address:patient_addresses(city, neighborhood, zone_type),
      clinical:patient_clinical_profiles(complexity_level, diagnosis_main, clinical_tags, risk_braden, risk_morse, oxygen_usage),
      financial:patient_financial_profiles(billing_status, bond_type, payment_method),
      administrative:patient_administrative_profiles(admission_type, technical_supervisor_name, contract_status),
      shifts(start_time, professional_id)
    `, { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (gender && gender !== 'all') {
    query = query.eq('gender', gender);
  }
  if (contractorId && contractorId !== 'all') {
    query = query.eq('contractor.id', contractorId);
  }
  if (billingStatus && billingStatus !== 'all') {
    query = query.eq('financial.billing_status', billingStatus);
  }
  if (bondType && bondType !== 'all') {
    query = query.eq('financial.bond_type', bondType);
  }
  if (contractStatus && contractStatus !== 'all') {
    query = query.eq('administrative.contract_status', contractStatus);
  }
  if (complexity && complexity !== 'all') {
    query = query.eq('clinical.complexity_level', complexity);
  }
  if (city) {
    query = query.ilike('address.city', `%${city}%`);
  }
  if (neighborhood) {
    query = query.ilike('address.neighborhood', `%${neighborhood}%`);
  }
  if (zoneType && zoneType !== 'all') {
    query = query.eq('address.zone_type', zoneType);
  }
  if (diagnosis) {
    query = query.ilike('clinical.diagnosis_main', `%${diagnosis}%`);
  }
  if (admissionType && admissionType !== 'all') {
    query = query.eq('administrative.admission_type', admissionType);
  }
  if (supervisor) {
    query = query.ilike('administrative.technical_supervisor_name', `%${supervisor}%`);
  }
  if (clinicalTag) {
    query = query.contains('clinical.clinical_tags', [clinicalTag]);
  }
  if (paymentMethod) {
    query = query.ilike('financial.payment_method', `%${paymentMethod}%`);
  }
  if (riskBradenMin !== undefined) {
    query = query.gte('clinical.risk_braden', riskBradenMin);
  }
  if (riskBradenMax !== undefined) {
    query = query.lte('clinical.risk_braden', riskBradenMax);
  }
  if (riskMorseMin !== undefined) {
    query = query.gte('clinical.risk_morse', riskMorseMin);
  }
  if (riskMorseMax !== undefined) {
    query = query.lte('clinical.risk_morse', riskMorseMax);
  }
  if (oxygenUsage === 'yes') {
    query = query.eq('clinical.oxygen_usage', true);
  } else if (oxygenUsage === 'no') {
    query = query.eq('clinical.oxygen_usage', false);
  }
  if (ageMin || ageMax) {
    const today = new Date();
    if (ageMin) {
      const maxBirth = new Date(today);
      maxBirth.setFullYear(today.getFullYear() - ageMin);
      query = query.lte('date_of_birth', maxBirth.toISOString());
    }
    if (ageMax) {
      const minBirth = new Date(today);
      minBirth.setFullYear(today.getFullYear() - ageMax);
      query = query.gte('date_of_birth', minBirth.toISOString());
    }
  }
  if (contractorId && contractorId !== 'all') {
    query = query.eq('contractor.id', contractorId);
  }

  if (billingStatus && billingStatus !== 'all') {
    query = query.eq('financial.billing_status', billingStatus);
  }

  query = query.order("full_name", { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Erro no Grid de Pacientes:", error);
    return { data: [], total: 0, stats: { active: 0, hospitalized: 0, total: 0 } };
  }

  const now = new Date();

  const formatted: PatientGridItem[] = (data || []).map((p: GridPatientRow) => {
    const birth = p.date_of_birth ? new Date(p.date_of_birth) : null;
    const age = birth ? now.getFullYear() - birth.getFullYear() - (now < addDays(new Date(now.getFullYear(), birth.getMonth(), birth.getDate()), 0) ? 1 : 0) : null;

    // Próximo plantão simples: menor start_time futuro na lista (já que não ordenamos no select)
    const futureShifts = (p.shifts || []).filter((s) => new Date(s.start_time) >= now);
    const nextShiftData = futureShifts.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
    const nextShift = nextShiftData
      ? {
          date: nextShiftData.start_time,
          is_open: !nextShiftData.professional_id,
          professional_name: nextShiftData.professional_id ? 'Escalado' : undefined,
        }
      : null;

    return {
      id: p.id,
      full_name: p.full_name,
      social_name: p.social_name,
      age,
      gender: p.gender ?? null,
      city: p.address?.[0]?.city || 'Local não inf.',
      status: p.status || 'active',
      complexity_level: p.clinical?.[0]?.complexity_level || null,
      diagnosis_main: p.clinical?.[0]?.diagnosis_main,
      contractor_name: p.contractor?.[0]?.name || 'Particular',
      billing_status: p.financial?.[0]?.billing_status || 'active',
      next_shift: nextShift,
      supervisor_name: p.administrative?.[0]?.technical_supervisor_name || null,
      // extras for filter check
      neighborhood: p.address?.[0]?.neighborhood,
      zone_type: p.address?.[0]?.zone_type,
      admission_type: p.administrative?.[0]?.admission_type,
      clinical_tags: p.clinical?.[0]?.clinical_tags || []
    };
  });

  const stats = {
    total: count || 0,
    active: formatted.filter((p) => p.status === 'active').length,
    hospitalized: formatted.filter((p) => p.status === 'hospitalized').length,
  };

  return {
    data: formatted,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
    stats,
  };
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
    const reason = (error as { message?: string })?.message || JSON.stringify(error);
    console.error("Erro ao buscar paciente completo:", reason);
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

  type InventoryRow = PatientInventoryDTO & { id: string; item_id?: string | null; item?: { id: string; name?: string; category?: string; is_trackable?: boolean | null; brand?: string | null } | null };
  let inventory: InventoryRow[] = (inventoryRows as InventoryRow[] | null) ?? [];
  const itemIds = Array.from(new Set(inventory.map((row) => row.item_id).filter(Boolean)));
  if (itemIds.length > 0) {
    const { data: masterItems } = await supabase
      .from("inventory_items")
      .select("id, name, category, is_trackable, brand")
      .in("id", itemIds);

    const map = new Map((masterItems ?? []).map((m) => [m.id, m]));
    inventory = inventory.map((row) => ({ ...row, item: map.get(row.item_id || "") || null }));
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
