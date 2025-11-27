import { z } from "zod";

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
  state: z.string().length(2, "UF inválida"),
  complement: z.string().optional(),
  referencePoint: z.string().optional(),
  zoneType: z.enum(["Urbana", "Rural", "Periurbana", "Comunidade", "Risco"]).optional(),
  travelNotes: z.string().optional(),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),

  // Detalhes do imóvel
  propertyType: z.enum(["Casa", "Apartamento", "Chácara/Sítio", "ILPI", "Pensão", "Outro"]).optional(),
  condoName: z.string().optional(),
  blockTower: z.string().optional(),
  floorNumber: z.coerce.number().optional(),
  unitNumber: z.string().optional(),

  // Logística e acesso
  ambulanceAccess: z.string().optional(),
  wheelchairAccess: z.enum(["Livre", "Com restrição", "Incompatível"]).optional(),
  elevatorStatus: z.enum(["Não tem", "Tem - Não comporta maca", "Tem - Comporta maca"]).optional(),
  streetAccessType: z.enum(["Rua Larga", "Rua Estreita", "Rua sem Saída", "Viela", "Estrada de Terra"]).optional(),
  parking: z.string().optional(),
  teamParking: z.string().optional(),
  externalStairs: z.string().optional(),

  // Segurança / portaria
  has24hConcierge: z.boolean().default(false),
  conciergeContact: z.string().optional(),
  entryProcedure: z.string().optional(),
  nightAccessRisk: z.enum(["Baixo", "Médio", "Alto"]).optional(),
  areaRiskType: z.enum(["Baixo", "Médio", "Alto"]).optional(),
  worksOrObstacles: z.string().optional(),

  // Infraestrutura
  hasWifi: z.boolean().default(false),
  hasSmokers: z.boolean().default(false),
  electricInfra: z.enum(["110v", "220v", "Bivolt", "Instável"]).optional(),
  backupPower: z.enum(["Nenhum", "Gerador", "Nobreak", "Rede Dupla"]).optional(),
  cellSignalQuality: z.enum(["Bom", "Razoável", "Ruim", "Inexistente"]).optional(),
  powerOutletsDesc: z.string().optional(),
  equipmentSpace: z.enum(["Adequado", "Restrito", "Crítico"]).optional(),
  waterSource: z.string().optional(),
  adaptedBathroom: z.boolean().default(false),
  stayLocation: z.string().optional(),
  pets: z.any().optional(),
  notes: z.string().optional(),

  // Legados
  bedType: z.string().optional(),
  mattressType: z.string().optional(),
  voltage: z.string().optional(),
  backupPowerSource: z.string().optional(),
  petsDescription: z.string().optional(),
  animalsBehavior: z.string().optional(),
  generalObservations: z.string().optional(),

  householdMembers: z.array(HouseholdMemberZ).optional(),
});

export type PatientAddressForm = z.infer<typeof PatientAddressZ>;
