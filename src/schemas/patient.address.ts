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
  zoneType: z.enum(["Urbana", "Rural", "Periurbana", "Comunidade", "Risco", "Nao_informada"]).optional(),
  travelNotes: z.string().optional(),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
  geoLatitude: z.number().optional(),
  geoLongitude: z.number().optional(),

  // Detalhes do imóvel
  propertyType: z.enum(["Casa", "Apartamento", "Chacara_Sitio", "ILPI", "Pensão", "Comercial", "Outro", "Nao_informado"]).optional(),
  condoName: z.string().optional(),
  blockTower: z.string().optional(),
  floorNumber: z.coerce.number().optional(),
  unitNumber: z.string().optional(),

  // Logística e acesso
  ambulanceAccess: z.enum(["Total", "Parcial", "Dificil", "Nao_acessa", "Nao_informado"]).optional(),
  wheelchairAccess: z.enum(["Livre", "Com restrição", "Incompatível", "Nao_avaliado"]).optional(),
  elevatorStatus: z.enum(["Não tem", "Tem - Não comporta maca", "Tem - Comporta maca", "Nao_informado"]).optional(),
  streetAccessType: z.enum(["Rua Larga", "Rua Estreita", "Rua sem Saída", "Viela", "Estrada de Terra", "Nao_informado"]).optional(),
  parking: z.string().optional(),
  teamParking: z.string().optional(),
  externalStairs: z.string().optional(),

  // Segurança / portaria
  has24hConcierge: z.boolean().default(false),
  conciergeContact: z.string().optional(),
  entryProcedure: z.string().optional(),
  nightAccessRisk: z.enum(["Baixo", "Médio", "Alto", "Nao_avaliado"]).optional(),
  areaRiskType: z.enum(["Baixo", "Médio", "Alto", "Nao_avaliado"]).optional(),
  worksOrObstacles: z.string().optional(),

  // Infraestrutura
  hasWifi: z.boolean().default(false),
  hasSmokers: z.boolean().default(false),
  electricInfra: z.enum(["110v", "220v", "Bivolt", "Instável", "Nao_informada"]).optional(),
  backupPower: z.enum(["Nenhum", "Gerador", "Nobreak", "Rede Dupla", "Nao_informado"]).optional(),
  cellSignalQuality: z.enum(["Bom", "Razoável", "Ruim", "Inexistente", "Nao_informado"]).optional(),
  powerOutletsDesc: z.string().optional(),
  equipmentSpace: z.enum(["Adequado", "Restrito", "Critico", "Nao_avaliado"]).optional(),
  waterSource: z.enum(["Rede_publica", "Poco_artesiano", "Cisterna", "Outro", "Nao_informado"]).optional(),
  adaptedBathroom: z.boolean().default(false),
  stayLocation: z.string().optional(),
  pets: z.any().optional(),
  notes: z.string().optional(),
  animalsBehavior: z.enum(["Doces", "Bravos", "Necessitam_contencao", "Nao_informado"]).optional(),
  bedType: z.enum(["Hospitalar", "Articulada", "Comum", "Colchao_no_chao", "Outro", "Nao_informado"]).optional(),
  mattressType: z.enum(["Pneumatico", "Viscoelastico", "Espuma_comum", "Mola", "Outro", "Nao_informado"]).optional(),

  // Legados
  voltage: z.string().optional(),
  backupPowerSource: z.string().optional(),
  petsDescription: z.string().optional(),
  generalObservations: z.string().optional(),

  householdMembers: z.array(HouseholdMemberZ).optional(),
});

export type PatientAddressForm = z.infer<typeof PatientAddressZ>;
