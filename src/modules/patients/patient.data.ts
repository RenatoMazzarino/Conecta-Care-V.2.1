import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";
import { PatientFinancialProfileDTO, FinancialRecordDTO } from "@/data/definitions/financial";
import { PatientClinicalDTO } from "@/data/definitions/clinical";
import { EmergencyContactDTO } from "@/data/definitions/team";
import { PatientAdministrativeDTO } from "@/data/definitions/administrative";
import { PatientInventoryDTO } from "@/data/definitions/inventory";
import { PatientDocumentDTO } from "@/data/definitions/documents";
import type {
  AmbulanceAccessValue,
  AnimalBehaviorValue,
  BedTypeValue,
  MattressTypeValue,
  NightAccessRiskValue,
  WaterSourceValue,
  ZoneTypeValue,
} from "@/data/definitions/address";

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
  zone_type?: ZoneTypeValue | null;
  travel_notes?: string | null;
  allowed_visit_hours?: string | null;
  facade_image_url?: string | null;
  eta_minutes?: number | null;
  geo_latitude?: number | null;
  geo_longitude?: number | null;
};

export type PatientDomicileRecord = {
  ambulance_access?: AmbulanceAccessValue | null;
  team_parking?: string | null;
  night_access_risk?: NightAccessRiskValue | null;
  gate_identification?: string | null;
  entry_procedure?: string | null;
  ventilation?: string | null;
  lighting_quality?: string | null;
  noise_level?: string | null;
  bed_type?: BedTypeValue | null;
  mattress_type?: MattressTypeValue | null;
  voltage?: string | null;
  backup_power_source?: string | null;
  water_source?: WaterSourceValue | null;
  has_wifi?: boolean | null;
  has_smokers?: boolean | null;
  hygiene_conditions?: string | null;
  pets_description?: string | null;
  animals_behavior?: AnimalBehaviorValue | null;
  general_observations?: string | null;
  pets?: any;
};

export type PatientHouseholdMember = {
  id?: string;
  name?: string;
  role?: string;
  type?: "resident" | "caregiver";
  schedule_note?: string | null;
};

export type PatientRelatedPersonRecord = {
  id: string;
  full_name: string;
  contact_type?: string | null;
  relation?: string | null;
  relation_description?: string | null;
  priority_order?: number | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  is_whatsapp?: boolean | null;
  email?: string | null;
  is_legal_guardian?: boolean | null;
  is_financial_responsible?: boolean | null;
  is_emergency_contact?: boolean | null;
  is_main_contact?: boolean | null;
  can_access_records?: boolean | null;
  can_authorize_procedures?: boolean | null;
  can_authorize_financial?: boolean | null;
  lives_with_patient?: string | null;
  has_keys?: boolean | null;
  contact_window?: string | null;
  preferred_contact?: string | null;
  receive_updates?: boolean | null;
  receive_admin?: boolean | null;
  opt_out_marketing?: boolean | null;
  notes?: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  rg?: string | null;
  rg_issuer?: string | null;
  rg_state?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_summary?: string | null;
};

export type CareTeamMemberRecord = {
  id: string;
  professional_id: string;
  role?: string | null;
  professional_category?: string | null;
  case_role?: string | null;
  regime?: string | null;
  employment_type?: string | null;
  shift_summary?: string | null;
  work_window?: string | null;
  internal_extension?: string | null;
  corporate_cell?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  is_primary?: boolean | null;
  is_technical_responsible?: boolean | null;
  is_family_focal_point?: boolean | null;
  professional?: {
    full_name?: string | null;
    contact_phone?: string | null;
    avatar_url?: string | null;
  } | null;
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
  place_of_birth_city?: string | null;
  place_of_birth_state?: string | null;
  place_of_birth_country?: string | null;
  preferred_language?: string | null;
  status?: string | null;
  record_status?: string | null;
  onboarding_step?: number | null;
  nickname?: string | null;
  education_level?: string | null;
  profession?: string | null;
  race_color?: string | null;
  is_pcd?: boolean | null;
  rg_issuer_state?: string | null;
  rg_issued_at?: string | null;
  doc_validation_status?: string | null;
  doc_validated_at?: string | null;
  doc_validated_by?: string | null;
  doc_validation_method?: string | null;
  contact_time_preference?: string | null;
  contact_notes?: string | null;
  marketing_consented_at?: string | null;
  marketing_consent_source?: string | null;
  marketing_consent_ip?: string | null;
  marketing_consent_status?: "pending" | "accepted" | "rejected" | null;
  civil_documents?: Array<{
    id: string;
    patient_id?: string | null;
    tenant_id?: string | null;
    doc_type?: string | null;
    doc_number?: string | null;
    issuer?: string | null;
    issued_at?: string | null;
    valid_until?: string | null;
  }> | null;
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
  related_persons?: PatientRelatedPersonRecord[];
  team?: CareTeamMemberRecord[];
  contacts?: EmergencyContactDTO[]; // compat legado
  ledger?: FinancialRecordDTO[];
  administrative?: PatientAdministrativeDTO[];
  admin_info?: any[];
  inventory?: PatientInventoryDTO[]; // Note: O DTO pode precisar de ajuste se o 'item' vier aninhado
  documents?: PatientDocumentDTO[];
  schedule_settings?: unknown[];
  
  // Dados Extras
  next_shifts?: PatientNextShift[];
  medications?: PatientMedicationRecord[];
};

type PatientListItem = Pick<
  FullPatientDetails,
  "id" | "full_name" | "cpf" | "gender" | "date_of_birth" | "record_status" | "created_at"
> & { status?: string | null };

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
  record_status?: string | null;
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
      record_status,
      onboarding_step,
      nickname,
      education_level,
      profession,
      race_color,
      is_pcd,
      place_of_birth_city,
      place_of_birth_state,
      place_of_birth_country,
      rg_issuer_state,
      rg_issued_at,
      doc_validation_status,
      doc_validated_at,
      doc_validated_by,
      doc_validation_method,
      contact_time_preference,
      contact_notes,
      marketing_consented_at,
      marketing_consent_source,
      marketing_consent_ip,
      accept_sms,
      accept_email,
      block_marketing,
      marketing_consent_status,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }

  return (patients ?? []).map((patient) => ({
    ...patient,
    status: (patient as any).record_status ?? null,
  }));
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
      id, full_name, social_name, date_of_birth, record_status, gender, onboarding_step,
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
    query = query.eq('record_status', status);
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
    query = query.eq('primary_contractor_id', contractorId);
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
    const recordStatus = p.record_status || 'active';

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
      status: recordStatus,
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
  
  // Busca principal (apenas a linha do paciente, sem dependências de relacionamentos no cache)
  const { data: patientRow, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (patientError) {
    const reason = (patientError as { message?: string })?.message || JSON.stringify(patientError);
    console.error("Erro ao buscar paciente completo:", reason);
    return null;
  }

  // Demais coleções buscadas em paralelo para evitar dependência de relacionamentos ausentes
  const [
    addressRes,
    domicileRes,
    householdRes,
    financialRes,
    administrativeRes,
    scheduleSettingsRes,
    documentsRes,
    civilDocsRes,
    relatedRes,
    careTeamRes,
    assignedAssetsRes,
    consumablesRes,
    movementsRes,
    ledgerRes,
    medicationsRes,
    clinicalSummaryRes,
    clinicalDevicesRes,
    clinicalAllergiesRes,
    clinicalRisksRes,
    contractorRes,
    legalGuardianViewRes,
  ] = await Promise.all([
    supabase.from("patient_addresses").select("*").eq("patient_id", patientId),
    supabase.from("patient_domiciles").select("*").eq("patient_id", patientId),
    supabase.from("patient_household_members").select("*").eq("patient_id", patientId),
    supabase.from("patient_financial_profiles").select("*").eq("patient_id", patientId),
    supabase.from("patient_administrative_profiles").select("*").eq("patient_id", patientId),
    supabase.from("patient_schedule_settings").select("*").eq("patient_id", patientId),
    supabase.from("patient_documents").select("*").eq("patient_id", patientId),
    supabase.from("patient_civil_documents").select("*").eq("patient_id", patientId),
    supabase.from("patient_related_persons").select("*").eq("patient_id", patientId),
    supabase.from("care_team_members").select("*").eq("patient_id", patientId),
    supabase.from("patient_assigned_assets").select("*").eq("patient_id", patientId),
    supabase.from("patient_consumables_stock").select("*").eq("patient_id", patientId),
    supabase.from("inventory_movements").select("*").eq("patient_id", patientId),
    supabase.from("financial_ledger_entries").select("*").eq("patient_id", patientId),
    supabase.from("patient_medications").select("*").eq("patient_id", patientId),
    supabase.from("patient_clinical_summaries").select("*").eq("patient_id", patientId),
    supabase.from("patient_devices").select("*").eq("patient_id", patientId),
    supabase.from("patient_allergies").select("*").eq("patient_id", patientId),
    supabase.from("patient_risk_scores").select("*").eq("patient_id", patientId),
    // contractor via FK direta se existir
    patientRow?.primary_contractor_id
      ? supabase.from("contractors").select("id,name,type").eq("id", patientRow.primary_contractor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("view_patient_legal_guardian_summary").select("*").eq("patient_id", patientId).maybeSingle(),
  ]);

  // Busca separada para contatos (evita depender de FK configurada)
  const { data: contacts } = await supabase
    .from("patient_emergency_contacts")
    .select("*")
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
  const civilDocs = Array.isArray(civilDocsRes?.data)
    ? (civilDocsRes.data as any[]).map((doc: any) => ({
        id: doc.id,
        patient_id: doc.patient_id,
        tenant_id: doc.tenant_id,
        doc_type: doc.doc_type,
        doc_number: doc.doc_number,
        issuer: doc.issuer,
        issued_at: doc.issued_at,
        valid_until: doc.valid_until,
      }))
    : [];

  const relatedPersons = Array.isArray(relatedRes?.data)
    ? (relatedRes.data as any[]).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        relation: p.relation,
        relation_description: p.relation_description,
        contact_type: p.contact_type,
        priority_order: p.priority_order,
        phone_primary: p.phone_primary,
        phone_secondary: p.phone_secondary,
        is_whatsapp: p.is_whatsapp,
        email: p.email,
        is_legal_guardian: p.is_legal_guardian,
        is_financial_responsible: p.is_financial_responsible,
        is_emergency_contact: p.is_emergency_contact,
        is_main_contact: p.is_main_contact,
        can_access_records: p.can_access_records,
        can_authorize_procedures: p.can_authorize_procedures,
        can_authorize_financial: p.can_authorize_financial,
        lives_with_patient: p.lives_with_patient,
        has_keys: p.has_keys,
        contact_window: p.contact_window,
        preferred_contact: p.preferred_contact,
        receive_updates: p.receive_updates,
        receive_admin: p.receive_admin,
        opt_out_marketing: p.opt_out_marketing,
        notes: p.notes,
        cpf: p.cpf,
        birth_date: p.birth_date,
        rg: p.rg,
        rg_issuer: p.rg_issuer,
        rg_state: p.rg_state,
        address_street: p.address_street,
        address_city: p.address_city,
        address_state: p.address_state,
        address_summary: p.address_summary,
      }))
    : [];

  let teamMembers: any[] = Array.isArray(careTeamRes?.data)
    ? (careTeamRes.data as any[]).map((t: any) => ({
        id: t.id,
        patient_id: t.patient_id,
        professional_id: t.professional_id,
        role: t.role,
        professional_category: t.professional_category,
        case_role: t.case_role,
        regime: t.regime,
        status: t.status,
        is_primary: t.is_primary,
        employment_type: t.employment_type,
        shift_summary: t.shift_summary,
        work_window: t.work_window,
        internal_extension: t.internal_extension,
        corporate_cell: t.corporate_cell,
        contact_phone: t.contact_phone,
        contact_email: t.contact_email,
        start_date: t.start_date,
        end_date: t.end_date,
        is_technical_responsible: t.is_technical_responsible,
        is_family_focal_point: t.is_family_focal_point,
        professional: null,
      }))
    : [];

  // Enriquecimento de profissionais sem depender de FK
  const profIds = Array.from(new Set(teamMembers.map((t) => t.professional_id).filter(Boolean)));
  if (profIds.length > 0) {
    const { data: profs } = await supabase
      .from("professional_profiles")
      .select("id, full_name, contact_phone, avatar_url")
      .in("id", profIds);

    const map = new Map((profs || []).map((p) => [p.id, p]));
    teamMembers = teamMembers.map((t) => ({
      ...t,
      professional: map.get(t.professional_id || "") || null,
    }));
  }

  // Busca separada admin_info para evitar necessidade de relacionamento configurado no cache
  const { data: adminInfoRows } = await supabase
    .from("patient_admin_info")
    .select(`*`)
    .eq("patient_id", patientId)
    .limit(1);

  // Busca separada oxigênio
  const { data: oxygenRow } = await supabase
    .from("patient_oxygen_support")
    .select("*")
    .eq("patient_id", patientId)
    .single();

  // Monta resumo clínico a partir das tabelas normalizadas
  const clinicalSummary = (clinicalSummaryRes?.data as any[] | null)?.[0] || {};
  let referenceProfessionalName: string | null = null;
  if (clinicalSummary?.reference_professional_id) {
    const { data: refProf } = await supabase.from("professional_profiles").select("full_name").eq("id", clinicalSummary.reference_professional_id).single();
    referenceProfessionalName = refProf?.full_name || null;
  }
  const devices = (clinicalDevicesRes?.data as any[] || []).map((d: any) => d.device_type).filter(Boolean);
  const allergies = (clinicalAllergiesRes?.data as any[] || []).map((a: any) => a.name).filter(Boolean);
  const risks = (clinicalRisksRes?.data as any[] || []);
  const oxygen = oxygenRow || {};

  const normalized = {
    ...patientRow,
    contractor: contractorRes?.data ? [contractorRes.data] : null,
    address: addressRes?.data || [],
    domicile: domicileRes?.data || [],
    household: householdRes?.data || [],
    financial: financialRes?.data || [],
    administrative: administrativeRes?.data || [],
    schedule_settings: scheduleSettingsRes?.data || [],
    documents: documentsRes?.data || [],
    ledger: ledgerRes?.data || [],
    medications: medicationsRes?.data || [],
    assigned_assets: assignedAssetsRes?.data || [],
    consumables: consumablesRes?.data || [],
    movements: movementsRes?.data || [],
    legal_guardian_summary: legalGuardianViewRes?.data || null,
    status: (patientRow as any)?.record_status ?? null,
    civil_documents: civilDocs,
    related_persons: relatedPersons,
    team: teamMembers,
    contacts: relatedPersons, // compatibilidade com componentes antigos
    admin_info: adminInfoRows || [],
    clinical: [{
      patient_id: patientRow.id,
      cid_main: clinicalSummary.cid_main,
      diagnosis_main: clinicalSummary.diagnosis_main,
      primary_diagnosis_description: clinicalSummary.primary_diagnosis_description || clinicalSummary.diagnosis_description || null,
      complexity_level: clinicalSummary.complexity_level,
      blood_type: clinicalSummary.blood_type,
      clinical_summary: clinicalSummary.clinical_summary,
      last_clinical_update_at: clinicalSummary.last_clinical_update_at,
      reference_professional_name: referenceProfessionalName,
      risk_braden: risks.find((r: any) => r.risk_type === "braden")?.score,
      risk_morse: risks.find((r: any) => r.risk_type === "morse")?.score,
      oxygen_usage: oxygen.in_use,
      oxygen_mode: oxygen.mode,
      oxygen_interface: oxygen.interface,
      oxygen_flow: oxygen.flow,
      oxygen_regime: oxygen.regime,
      devices,
      allergies,
    }],
  };

  return { ...normalized, contacts: contacts ?? [], team: teamMembers, inventory, next_shifts: shifts || [] } as unknown as FullPatientDetails;
}
