'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logSystemAction } from "../admin/audit.service";
import { PatientAddressZ, PatientAddressForm } from "@/schemas/patient.address";

export async function upsertAddressAction(data: PatientAddressForm) {
  const supabase = await createClient();

  const parsed = PatientAddressZ.safeParse(data);
  if (!parsed.success) {
    console.error("Erro validação address:", parsed.error);
    return { success: false, error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const input = parsed.data;
  const patientId = input.patientId;

  const addressPayload = {
    patient_id: patientId,
    zip_code: input.zipCode,
    street: input.addressLine,
    number: input.number,
    neighborhood: input.neighborhood,
    city: input.city,
    state: input.state,
    complement: input.complement,
    reference_point: input.referencePoint,
    zone_type: input.zoneType,
    travel_notes: input.travelNotes,
    geo_lat: input.geoLat || input.geoLatitude,
    geo_lng: input.geoLng || input.geoLongitude,
    geo_latitude: input.geoLatitude,
    geo_longitude: input.geoLongitude,
    property_type: input.propertyType,
    condo_name: input.condoName,
    block_tower: input.blockTower,
    floor_number: input.floorNumber,
    unit_number: input.unitNumber,
    elevator_status: input.elevatorStatus,
    wheelchair_access: input.wheelchairAccess,
    street_access_type: input.streetAccessType,
    parking: input.parking,
    team_parking: input.teamParking,
    has_24h_concierge: input.has24hConcierge,
    concierge_contact: input.conciergeContact,
    entry_procedure: input.entryProcedure,
    night_access_risk: input.nightAccessRisk,
    area_risk_type: input.areaRiskType,
    works_or_obstacles: input.worksOrObstacles,
    cell_signal_quality: input.cellSignalQuality,
    power_outlets_desc: input.powerOutletsDesc,
    equipment_space: input.equipmentSpace,
    water_source: input.waterSource,
    electric_infra: input.electricInfra,
    backup_power: input.backupPower,
    adapted_bathroom: input.adaptedBathroom,
    stay_location: input.stayLocation,
    pets: input.pets,
    notes: input.notes,
    bed_type: input.bedType,
    mattress_type: input.mattressType,
    animal_behavior: input.animalsBehavior,
    updated_at: new Date().toISOString(),
  };

  const { error: addrError } = await supabase
    .from('patient_addresses')
    .upsert(addressPayload, { onConflict: 'patient_id' });

  if (addrError) {
    console.error("Erro ao salvar endereço:", addrError);
    return { success: false, error: "Erro ao salvar endereço base." };
  }

  // Domicílio (infraestrutura legada)
  const domicilePayload = {
    patient_id: patientId,
    ambulance_access: input.ambulanceAccess,
    team_parking: input.teamParking,
    night_access_risk: input.nightAccessRisk,
    entry_procedure: input.entryProcedure,
    bed_type: input.bedType,
    mattress_type: input.mattressType,
    voltage: input.voltage,
    backup_power_source: input.backupPowerSource,
    water_source: input.waterSource,
    has_wifi: input.hasWifi,
    has_smokers: input.hasSmokers,
    pets_description: input.petsDescription,
    animals_behavior: input.animalsBehavior,
    general_observations: input.generalObservations,
  };

  const { error: domError } = await supabase
    .from('patient_domiciles')
    .upsert(domicilePayload, { onConflict: 'patient_id' });

  if (domError) {
    console.error("Erro ao salvar domicílio:", domError);
    return { success: false, error: "Erro ao salvar dados de domicílio." };
  }

  if (input.householdMembers) {
    await supabase.from('patient_household_members').delete().eq('patient_id', patientId);
    if (input.householdMembers.length > 0) {
      const membersToInsert = input.householdMembers.map((m) => ({
        patient_id: patientId,
        name: m.name,
        role: m.role,
        type: m.type,
        schedule_note: m.scheduleNote,
      }));
      const { error: memberError } = await supabase
        .from('patient_household_members')
        .insert(membersToInsert);
      if (memberError) {
        console.error("Erro ao salvar membros:", memberError);
        return { success: false, error: "Erro ao salvar familiares." };
      }
    }
  }

  try {
    await logSystemAction({
      action: "UPDATE",
      entity: "patient_addresses",
      entityId: patientId,
      changes: { payload: { old: null, new: addressPayload } },
      reason: "Atualização via Portal Administrativo",
    });
  } catch (logErr) {
    console.error("Erro ao auditar endereço:", logErr);
  }

  revalidatePath(`/patients/${patientId}`);
  return { success: true };
}
