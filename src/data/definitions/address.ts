import { z } from "zod";

export type AddressEnumOption<T extends string> = {
  label: string;
  value: T;
  legacy?: string[];
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]/g, "")
    .toLowerCase();

export function resolveAddressEnumValue<T extends string>(
  options: AddressEnumOption<T>[],
  raw?: string | null,
): T | undefined {
  if (!raw) return undefined;
  const target = normalize(raw);
  return options.find((option) => {
    if (normalize(option.value) === target) return true;
    return option.legacy?.some((legacyValue) => normalize(legacyValue) === target);
  })?.value;
}

export const brazilUfValues = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
export type BrazilUfValue = typeof brazilUfValues[number];

const BrazilUfSchema = z
  .string()
  .min(2, "UF inválida")
  .max(2, "UF inválida")
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.enum(brazilUfValues));

export const zoneTypeValues = ["Urbana", "Rural", "Periurbana", "Comunidade", "Risco", "Nao_informada"] as const;
export type ZoneTypeValue = typeof zoneTypeValues[number];
export const zoneTypeOptions: AddressEnumOption<ZoneTypeValue>[] = [
  { label: "Urbana", value: "Urbana" },
  { label: "Rural", value: "Rural" },
  { label: "Periurbana", value: "Periurbana" },
  { label: "Comunidade", value: "Comunidade" },
  { label: "Área de risco", value: "Risco", legacy: ["Área de Risco"] },
  { label: "Não informada", value: "Nao_informada", legacy: ["Não informado"] },
];

export const propertyTypeValues = [
  "Casa",
  "Apartamento",
  "Chacara_Sitio",
  "ILPI",
  "Pensão",
  "Comercial",
  "Outro",
  "Nao_informado",
] as const;
export type PropertyTypeValue = typeof propertyTypeValues[number];
export const propertyTypeOptions: AddressEnumOption<PropertyTypeValue>[] = [
  { label: "Casa", value: "Casa" },
  { label: "Apartamento", value: "Apartamento" },
  { label: "Chácara / Sítio", value: "Chacara_Sitio", legacy: ["Chácara/Sítio"] },
  { label: "ILPI", value: "ILPI" },
  { label: "Pensão", value: "Pensão" },
  { label: "Comercial", value: "Comercial" },
  { label: "Outro", value: "Outro" },
  { label: "Não informado", value: "Nao_informado" },
];

export const elevatorStatusValues = ["Nao_tem", "Tem_nao_comporta_maca", "Tem_comporta_maca", "Nao_informado"] as const;
export type ElevatorStatusValue = typeof elevatorStatusValues[number];
export const elevatorStatusOptions: AddressEnumOption<ElevatorStatusValue>[] = [
  { label: "Não tem", value: "Nao_tem", legacy: ["Nao tem"] },
  { label: "Tem - Não comporta maca", value: "Tem_nao_comporta_maca" },
  { label: "Tem - Comporta maca", value: "Tem_comporta_maca" },
  { label: "Não informado", value: "Nao_informado" },
];

export const wheelchairAccessValues = ["Livre", "Com_restricao", "Incompativel", "Nao_avaliado"] as const;
export type WheelchairAccessValue = typeof wheelchairAccessValues[number];
export const wheelchairAccessOptions: AddressEnumOption<WheelchairAccessValue>[] = [
  { label: "Livre", value: "Livre" },
  { label: "Com restrição", value: "Com_restricao", legacy: ["Com restrição"] },
  { label: "Incompatível", value: "Incompativel" },
  { label: "Não avaliado", value: "Nao_avaliado" },
];

export const streetAccessTypeValues = ["Rua_larga", "Rua_estreita", "Rua_sem_saida", "Viela", "Nao_informado"] as const;
export type StreetAccessTypeValue = typeof streetAccessTypeValues[number];
export const streetAccessTypeOptions: AddressEnumOption<StreetAccessTypeValue>[] = [
  { label: "Rua larga", value: "Rua_larga", legacy: ["Rua Larga"] },
  { label: "Rua estreita", value: "Rua_estreita", legacy: ["Rua Estreita"] },
  { label: "Rua sem saída", value: "Rua_sem_saida", legacy: ["Rua sem Saída"] },
  { label: "Viela", value: "Viela" },
  { label: "Não informado", value: "Nao_informado", legacy: ["Estrada de Terra"] },
];

export const cellSignalQualityValues = ["Bom", "Razoavel", "Ruim", "Nao_informado"] as const;
export type CellSignalQualityValue = typeof cellSignalQualityValues[number];
export const cellSignalQualityOptions: AddressEnumOption<CellSignalQualityValue>[] = [
  { label: "Bom", value: "Bom" },
  { label: "Razoável", value: "Razoavel" },
  { label: "Ruim", value: "Ruim" },
  { label: "Não informado", value: "Nao_informado", legacy: ["Inexistente"] },
];

export const equipmentSpaceValues = ["Adequado", "Restrito", "Critico", "Nao_avaliado"] as const;
export type EquipmentSpaceValue = typeof equipmentSpaceValues[number];
export const equipmentSpaceOptions: AddressEnumOption<EquipmentSpaceValue>[] = [
  { label: "Adequado", value: "Adequado" },
  { label: "Restrito", value: "Restrito" },
  { label: "Crítico", value: "Critico" },
  { label: "Não avaliado", value: "Nao_avaliado" },
];

export const ambulanceAccessValues = ["Total", "Parcial", "Dificil", "Nao_acessa", "Nao_informado"] as const;
export type AmbulanceAccessValue = typeof ambulanceAccessValues[number];
export const ambulanceAccessOptions: AddressEnumOption<AmbulanceAccessValue>[] = [
  { label: "Total", value: "Total" },
  { label: "Parcial", value: "Parcial" },
  { label: "Difícil", value: "Dificil" },
  { label: "Não acessa", value: "Nao_acessa" },
  { label: "Não informado", value: "Nao_informado" },
];

export const nightAccessRiskValues = ["Baixo", "Medio", "Alto", "Nao_avaliado"] as const;
export type NightAccessRiskValue = typeof nightAccessRiskValues[number];
export const nightAccessRiskOptions: AddressEnumOption<NightAccessRiskValue>[] = [
  { label: "Baixo", value: "Baixo" },
  { label: "Médio", value: "Medio", legacy: ["Médio"] },
  { label: "Alto", value: "Alto" },
  { label: "Não avaliado", value: "Nao_avaliado" },
];

export const electricInfraValues = ["110", "220", "Bivolt", "Nao_informada"] as const;
export type ElectricInfraValue = typeof electricInfraValues[number];
export const electricInfraOptions: AddressEnumOption<ElectricInfraValue>[] = [
  { label: "110v", value: "110", legacy: ["110v"] },
  { label: "220v", value: "220", legacy: ["220v"] },
  { label: "Bivolt", value: "Bivolt" },
  { label: "Não informada", value: "Nao_informada", legacy: ["Instável", "Instavel"] },
];

export const backupPowerValues = ["Nenhuma", "Gerador", "Nobreak", "Outros", "Nao_informado"] as const;
export type BackupPowerValue = typeof backupPowerValues[number];
export const backupPowerOptions: AddressEnumOption<BackupPowerValue>[] = [
  { label: "Nenhuma", value: "Nenhuma", legacy: ["Nenhum"] },
  { label: "Gerador", value: "Gerador" },
  { label: "Nobreak", value: "Nobreak" },
  { label: "Outros (rede dupla, etc.)", value: "Outros", legacy: ["Rede Dupla"] },
  { label: "Não informado", value: "Nao_informado" },
];

export const waterSourceValues = ["Rede_publica", "Poco_artesiano", "Cisterna", "Outro", "Nao_informado"] as const;
export type WaterSourceValue = typeof waterSourceValues[number];
export const waterSourceOptions: AddressEnumOption<WaterSourceValue>[] = [
  { label: "Rede pública", value: "Rede_publica" },
  { label: "Poço artesiano", value: "Poco_artesiano" },
  { label: "Cisterna", value: "Cisterna" },
  { label: "Outro", value: "Outro" },
  { label: "Não informado", value: "Nao_informado" },
];

export const animalBehaviorValues = ["Doces", "Bravos", "Necessitam_contencao", "Nao_informado"] as const;
export type AnimalBehaviorValue = typeof animalBehaviorValues[number];
export const animalBehaviorOptions: AddressEnumOption<AnimalBehaviorValue>[] = [
  { label: "Doces", value: "Doces" },
  { label: "Bravos", value: "Bravos" },
  { label: "Necessitam contenção", value: "Necessitam_contencao" },
  { label: "Não informado", value: "Nao_informado" },
];

export const bedTypeValues = ["Hospitalar", "Articulada", "Comum", "Colchao_no_chao", "Outro", "Nao_informado"] as const;
export type BedTypeValue = typeof bedTypeValues[number];
export const bedTypeOptions: AddressEnumOption<BedTypeValue>[] = [
  { label: "Hospitalar", value: "Hospitalar" },
  { label: "Articulada", value: "Articulada" },
  { label: "Comum", value: "Comum" },
  { label: "Colchão no chão", value: "Colchao_no_chao" },
  { label: "Outro", value: "Outro" },
  { label: "Não informado", value: "Nao_informado" },
];

export const mattressTypeValues = ["Pneumatico", "Viscoelastico", "Espuma_comum", "Mola", "Outro", "Nao_informado"] as const;
export type MattressTypeValue = typeof mattressTypeValues[number];
export const mattressTypeOptions: AddressEnumOption<MattressTypeValue>[] = [
  { label: "Pneumático", value: "Pneumatico" },
  { label: "Viscoelástico", value: "Viscoelastico" },
  { label: "Espuma comum", value: "Espuma_comum" },
  { label: "Mola", value: "Mola" },
  { label: "Outro", value: "Outro" },
  { label: "Não informado", value: "Nao_informado" },
];

export const HouseholdMemberSchema = z.object({
  id: z.string().uuid().optional(), // Opcional para novos
  name: z.string().min(2, "Nome obrigatório"),
  role: z.string().min(2, "Função obrigatória"),
  type: z.enum(["resident", "caregiver"]),
  schedule_note: z.string().optional(),
});

export const PatientAddressSchema = z.object({
  // Identificadores
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  
  // --- 1. Endereço Base (PAD) ---
  zip_code: z.string().min(8, "CEP inválido"),
  street: z.string().min(2, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: BrazilUfSchema,
  complement: z.string().optional(),
  reference_point: z.string().optional(),
  zone_type: z.enum(zoneTypeValues).optional(),
  travel_notes: z.string().optional(),
  geo_latitude: z.number().optional(),
  geo_longitude: z.number().optional(),
  
  // --- 2. Detalhes do Imóvel ---
  property_type: z.enum(propertyTypeValues).optional(),
  condo_name: z.string().optional(),
  block_tower: z.string().optional(),
  floor_number: z.coerce.number().optional(),
  unit_number: z.string().optional(),
  
  // --- 3. Logística de Acesso ---
  ambulance_access: z.enum(ambulanceAccessValues).optional(),
  street_access_type: z.enum(streetAccessTypeValues).optional(),
  parking: z.string().optional(),
  team_parking: z.string().optional(),
  elevator_status: z.enum(elevatorStatusValues).optional(),
  wheelchair_access: z.enum(wheelchairAccessValues).optional(),
  external_stairs: z.string().optional(),
  
  // --- 4. Segurança & Portaria ---
  has_24h_concierge: z.boolean().default(false),
  concierge_contact: z.string().optional(),
  entry_procedure: z.string().optional(),
  night_access_risk: z.enum(nightAccessRiskValues).optional(),
  area_risk_type: z.enum(["Baixo", "Médio", "Alto", "Nao_avaliado"]).optional(),
  works_or_obstacles: z.string().optional(),
  
  // --- 5. Domicílio & Infraestrutura ---
  has_wifi: z.boolean().default(false),
  has_smokers: z.boolean().default(false),
  electric_infra: z.enum(electricInfraValues).optional(),
  backup_power: z.enum(backupPowerValues).optional(),
  cell_signal_quality: z.enum(cellSignalQualityValues).optional(),
  power_outlets_desc: z.string().optional(),
  equipment_space: z.enum(equipmentSpaceValues).optional(),
  water_source: z.enum(waterSourceValues).optional(),
  adapted_bathroom: z.boolean().default(false),
  stay_location: z.string().optional(),
  pets: z.any().optional(),
  notes: z.string().optional(),
  
  // Legados que seguem existindo na UI atual
  bed_type: z.enum(bedTypeValues).optional(),
  mattress_type: z.enum(mattressTypeValues).optional(),
  voltage: z.string().optional(),
  backup_power_source: z.string().optional(),
  pets_description: z.string().optional(),
  animals_behavior: z.enum(animalBehaviorValues).optional(),
  general_observations: z.string().optional(),
  
  // Membros (Array para gerenciar a sub-tabela)
  household_members: z.array(HouseholdMemberSchema).optional(),
});

export type PatientAddressDTO = z.infer<typeof PatientAddressSchema>;

export const PatientAddressZ = PatientAddressSchema;
