'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logSystemAction } from "../admin/audit.service";
import { PatientAddressZ, PatientAddressForm } from "@/schemas/patient.address";

const normalizeString = (value?: string | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const STATE_REGEX = /^[A-Z]{2}$/;
const CEP_DIGITS_REGEX = /^\d{8}$/;
const CEP_SERVICE_BASE_URL = (process.env.INTERNAL_CEP_SERVICE_URL || 'https://brasilapi.com.br/api/cep/v2').replace(/\/$/, '');

const formatCep = (digits: string) => `${digits.slice(0, 5)}-${digits.slice(5)}`;

type CepValidationOutcome = { success: true } | { success: false; error: string };

async function validateCepAgainstState(cepDigits: string, expectedState: string): Promise<CepValidationOutcome> {
  const endpoint = `${CEP_SERVICE_BASE_URL}/${cepDigits}`;

  try {
    const response = await fetch(endpoint, { cache: 'no-store' });

    if (response.status === 404) {
      return { success: false, error: 'CEP não encontrado. Confira se os 8 dígitos informados estão corretos.' };
    }

    if (!response.ok) {
      console.warn('Falha ao consultar CEP na BrasilAPI:', response.status, endpoint);
      return { success: true };
    }

    const payload = await response.json();
    const cepState = String(payload?.state ?? payload?.stateAbbr ?? payload?.state_abbr ?? payload?.uf ?? '').toUpperCase();

    if (cepState && cepState !== expectedState) {
      return {
        success: false,
        error: `O CEP informado pertence ao estado ${cepState}, mas o campo UF está preenchido com ${expectedState}. Atualize os dados antes de salvar.`,
      };
    }

    return { success: true };
  } catch (error) {
    console.warn('Erro ao validar CEP na BrasilAPI:', error);
    return { success: true };
  }
}

export type UpsertAddressResult =
  | { success: true; address: Record<string, any> }
  | { success: false; error: string };

export async function upsertAddressAction(data: PatientAddressForm): Promise<UpsertAddressResult> {
  const supabase = await createClient();

  const parsed = PatientAddressZ.safeParse(data);
  if (!parsed.success) {
    console.error('Erro validação address:', parsed.error);
    return { success: false, error: 'Dados inválidos. Verifique os campos obrigatórios.' };
  }

  const input = parsed.data;
  const patientId = input.patientId;

  const normalizedState = input.state.trim().toUpperCase();
  if (!STATE_REGEX.test(normalizedState)) {
    return { success: false, error: 'UF inválida. Informe uma sigla com duas letras (ex.: SP).' };
  }

  const cepDigits = (input.zipCode ?? '').replace(/\D/g, '');
  if (!CEP_DIGITS_REGEX.test(cepDigits)) {
    return { success: false, error: 'CEP inválido. Use 8 dígitos (ex.: 01311000 ou 01311-000).' };
  }
  const formattedZipCode = formatCep(cepDigits);

  const cepValidation = await validateCepAgainstState(cepDigits, normalizedState);
  if (!cepValidation.success) {
    return { success: false, error: cepValidation.error };
  }

  const geoLatitude = input.geoLatitude ?? input.geoLat ?? null;
  const geoLongitude = input.geoLongitude ?? input.geoLng ?? null;

  const travelNotes = (() => {
    const base = normalizeString(input.travelNotes);
    const works = normalizeString(input.worksOrObstacles);
    if (!base && !works) return null;
    const sections: string[] = [];
    if (base) sections.push(base);
    if (works) sections.push(`Obras/obstáculos: ${works}`);
    return sections.join('\n\n');
  })();

  const parking = (() => {
    const base = normalizeString(input.parking);
    const team = normalizeString(input.teamParking);
    if (!base && !team) return null;
    if (base && team) return `${base} | Equipe: ${team}`;
    if (team) return `Equipe: ${team}`;
    return base;
  })();

  const petsDescription = (() => {
    const typed = normalizeString(input.petsDescription);
    if (typed) return typed;
    if (typeof input.pets === 'string') return normalizeString(input.pets);
    if (typeof input.pets === 'boolean') return input.pets ? 'Possui animais' : 'Sem animais';
    if (Array.isArray(input.pets) && input.pets.length > 0) return input.pets.map((item) => String(item)).join(', ');
    if (input.pets && typeof input.pets === 'object') {
      try {
        const serialized = JSON.stringify(input.pets);
        return serialized === '{}' ? null : serialized;
      } catch (err) {
        console.warn('Falha ao serializar campo legacy pets:', err);
      }
    }
    return null;
  })();

  const generalObservations = (() => {
    const notes = normalizeString(input.notes);
    const legacy = normalizeString(input.generalObservations);
    const stay = normalizeString(input.stayLocation);
    const chunks: string[] = [];
    if (notes) chunks.push(notes);
    if (legacy) chunks.push(legacy);
    if (stay) chunks.push(`Local de permanência: ${stay}`);
    return chunks.length ? chunks.join('\n\n') : null;
  })();

  const baseAddressPayload = {
    zip_code: formattedZipCode,
    street: input.addressLine.trim(),
    number: input.number.trim(),
    neighborhood: input.neighborhood.trim(),
    city: input.city.trim(),
    state: normalizedState,
    complement: normalizeString(input.complement),
    reference_point: normalizeString(input.referencePoint),
    zone_type: input.zoneType ?? null,
    travel_notes: travelNotes,
    geo_latitude: geoLatitude,
    geo_longitude: geoLongitude,
    property_type: input.propertyType ?? null,
    condo_name: normalizeString(input.condoName),
    block_tower: normalizeString(input.blockTower),
    floor_number: typeof input.floorNumber === 'number' ? input.floorNumber : null,
    unit_number: normalizeString(input.unitNumber),
    ambulance_access: input.ambulanceAccess ?? null,
    wheelchair_access: input.wheelchairAccess ?? null,
    elevator_status: input.elevatorStatus ?? null,
    street_access_type: input.streetAccessType ?? null,
    parking,
    has_24h_concierge: input.has24hConcierge ?? false,
    concierge_contact: normalizeString(input.conciergeContact),
    entry_procedure: normalizeString(input.entryProcedure),
    night_access_risk: input.nightAccessRisk ?? null,
    area_risk_type: input.areaRiskType ?? null,
    has_wifi: input.hasWifi ?? false,
    has_smokers: input.hasSmokers ?? false,
    electric_infra: input.electricInfra ?? null,
    backup_power: input.backupPower ?? null,
    cell_signal_quality: input.cellSignalQuality ?? null,
    power_outlets_desc: normalizeString(input.powerOutletsDesc),
    equipment_space: input.equipmentSpace ?? null,
    water_source: input.waterSource ?? null,
    adapted_bathroom: input.adaptedBathroom ?? false,
    bed_type: input.bedType ?? null,
    mattress_type: input.mattressType ?? null,
    animal_behavior: input.animalsBehavior ?? null,
    pets_description: petsDescription,
    general_observations: generalObservations,
  };

  const { data: existingAddressRow, error: loadCurrentError } = await supabase
    .from('patient_addresses')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (loadCurrentError && loadCurrentError.code !== 'PGRST116') {
    console.error('Erro ao carregar endereço atual:', loadCurrentError);
  }

  let addrError = null;

  if (existingAddressRow) {
    const { error } = await supabase
      .from('patient_addresses')
      .update(baseAddressPayload)
      .eq('patient_id', patientId);
    addrError = error;
  } else {
    const { error } = await supabase
      .from('patient_addresses')
      .insert({ patient_id: patientId, ...baseAddressPayload });
    addrError = error;
  }

  if (addrError) {
    console.error('Supabase erro patient_addresses:', addrError);
    return { success: false, error: 'Erro ao salvar endereço base.' };
  }

  const { data: savedAddress, error: fetchSavedError } = await supabase
    .from('patient_addresses')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (fetchSavedError || !savedAddress) {
    console.error('Erro ao recarregar endereço salvo:', fetchSavedError);
    return { success: false, error: 'Endereço salvo, mas não foi possível recarregar os dados. Atualize a página e tente novamente.' };
  }

  if (Array.isArray(input.householdMembers)) {
    const members = input.householdMembers.filter((member) => normalizeString(member.name));
    const { error: deleteError } = await supabase
      .from('patient_household_members')
      .delete()
      .eq('patient_id', patientId);

    if (deleteError) {
      console.error('Erro ao limpar familiares:', deleteError);
      return { success: false, error: 'Erro ao atualizar moradores.' };
    }

    if (members.length > 0) {
      const insertPayload = members.map((member) => ({
        id: member.id,
        patient_id: patientId,
        name: member.name.trim(),
        role: member.role.trim(),
        type: member.type,
        schedule_note: normalizeString(member.scheduleNote),
      }));

      const { error: insertError } = await supabase
        .from('patient_household_members')
        .insert(insertPayload);

      if (insertError) {
        return { success: false, error: 'Erro ao salvar moradores.' };
      }
    }
  }

  try {
    await logSystemAction({
      action: existingAddressRow ? 'UPDATE' : 'CREATE',
      entity: 'patient_addresses',
      entityId: patientId,
      changes: { payload: { old: existingAddressRow, new: savedAddress } },
      reason: 'Atualização via Portal Administrativo',
    });
    // TODO(address-audit): trocar action para 'address.update' assim que o contrato da TabHistory estiver consolidado.
  } catch (logErr) {
    console.error('Erro ao auditar endereço:', logErr);
  }

  revalidatePath(`/patients/${patientId}`);
  return { success: true, address: savedAddress };
}
