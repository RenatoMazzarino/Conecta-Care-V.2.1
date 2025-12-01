import { z } from "zod";
import {
  ambulanceAccessValues,
  animalBehaviorValues,
  backupPowerValues,
  bedTypeValues,
  brazilUfValues,
  cellSignalQualityValues,
  electricInfraValues,
  elevatorStatusValues,
  equipmentSpaceValues,
  mattressTypeValues,
  nightAccessRiskValues,
  propertyTypeValues,
  streetAccessTypeValues,
  waterSourceValues,
  wheelchairAccessValues,
  zoneTypeValues,
} from "@/data/definitions/address";

const HouseholdMemberZ = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nome obrigatório"),
  role: z.string().min(2, "Função obrigatória"),
  type: z.enum(["resident", "caregiver"]),
  scheduleNote: z.string().optional(),
});

export const PatientAddressZ = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  patientId: z.string().uuid(),

  // Endereço base
  zipCode: z.string().min(8, "CEP inválido"),
  addressLine: z.string().min(2, "Logradouro obrigatório"),
  number: z.string().min(1, "Número obrigatório"),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z
    .string()
    .min(2, "UF inválida")
    .max(2, "UF inválida")
    .transform((value) => value.trim().toUpperCase())
    .pipe(z.enum(brazilUfValues)),
  complement: z.string().optional(),
  referencePoint: z.string().optional(),
  zoneType: z.enum(zoneTypeValues).optional(),
  travelNotes: z.string().optional(),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
  geoLatitude: z.number().optional(),
  geoLongitude: z.number().optional(),

  // Detalhes do imóvel
  propertyType: z.enum(propertyTypeValues).optional(),
  condoName: z.string().optional(),
  blockTower: z.string().optional(),
  floorNumber: z.coerce.number().optional(),
  unitNumber: z.string().optional(),

  // Logística e acesso
  ambulanceAccess: z.enum(ambulanceAccessValues).optional(),
  wheelchairAccess: z.enum(wheelchairAccessValues).optional(),
  elevatorStatus: z.enum(elevatorStatusValues).optional(),
  streetAccessType: z.enum(streetAccessTypeValues).optional(),
  parking: z.string().optional(),
  teamParking: z.string().optional(),
  externalStairs: z.string().optional(),

  // Segurança / portaria
  has24hConcierge: z.boolean().default(false),
  conciergeContact: z.string().optional(),
  entryProcedure: z.string().optional(),
  nightAccessRisk: z.enum(nightAccessRiskValues).optional(),
  areaRiskType: z.enum(["Baixo", "Médio", "Alto", "Nao_avaliado"]).optional(),
  worksOrObstacles: z.string().optional(),

  // Infraestrutura
  hasWifi: z.boolean().default(false),
  hasSmokers: z.boolean().default(false),
  electricInfra: z.enum(electricInfraValues).optional(),
  backupPower: z.enum(backupPowerValues).optional(),
  cellSignalQuality: z.enum(cellSignalQualityValues).optional(),
  powerOutletsDesc: z.string().optional(),
  equipmentSpace: z.enum(equipmentSpaceValues).optional(),
  waterSource: z.enum(waterSourceValues).optional(),
  adaptedBathroom: z.boolean().default(false),
  stayLocation: z.string().optional(),
  pets: z.any().optional(),
  notes: z.string().optional(),
  animalsBehavior: z.enum(animalBehaviorValues).optional(),
  bedType: z.enum(bedTypeValues).optional(),
  mattressType: z.enum(mattressTypeValues).optional(),

  // Legados
  voltage: z.string().optional(),
  backupPowerSource: z.string().optional(),
  petsDescription: z.string().optional(),
  generalObservations: z.string().optional(),

  householdMembers: z.array(HouseholdMemberZ).optional(),
});

export type PatientAddressForm = z.infer<typeof PatientAddressZ>;
