import { z } from "zod";

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
  zip_code: z.string().min(8, "CEP inválido"), // Mantemos o campo legacy para compatibilidade
  street: z.string().min(2, "Rua obrigatória"), // Alias do address_line
  number: z.string().min(1, "Número obrigatório"),
  neighborhood: z.string().min(1, "Bairro obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida"),
  complement: z.string().optional(),
  reference_point: z.string().optional(),
  zone_type: z.enum(["Urbana", "Rural", "Periurbana", "Comunidade", "Risco"]).optional(),
  travel_notes: z.string().optional(),
  geo_lat: z.number().optional(),
  geo_lng: z.number().optional(),
  
  // --- 2. Detalhes do Imóvel ---
  property_type: z.enum(["Casa", "Apartamento", "Chácara/Sítio", "ILPI", "Pensão", "Outro"]).optional(),
  condo_name: z.string().optional(),
  block_tower: z.string().optional(),
  floor_number: z.coerce.number().optional(),
  unit_number: z.string().optional(),
  
  // --- 3. Logística de Acesso ---
  ambulance_access: z.string().optional(),
  street_access_type: z.enum(["Rua Larga", "Rua Estreita", "Rua sem Saída", "Viela", "Estrada de Terra"]).optional(),
  parking: z.string().optional(),
  team_parking: z.string().optional(),
  elevator_status: z.enum(["Não tem", "Tem - Não comporta maca", "Tem - Comporta maca"]).optional(),
  wheelchair_access: z.enum(["Livre", "Com restrição", "Incompatível"]).optional(),
  external_stairs: z.string().optional(),
  
  // --- 4. Segurança & Portaria ---
  has_24h_concierge: z.boolean().default(false),
  concierge_contact: z.string().optional(),
  entry_procedure: z.string().optional(),
  night_access_risk: z.enum(["Baixo", "Médio", "Alto"]).optional(),
  area_risk_type: z.enum(["Baixo", "Médio", "Alto"]).optional(),
  works_or_obstacles: z.string().optional(),
  
  // --- 5. Domicílio & Infraestrutura ---
  has_wifi: z.boolean().default(false),
  has_smokers: z.boolean().default(false),
  electric_infra: z.enum(["110v", "220v", "Bivolt", "Instável"]).optional(),
  backup_power: z.enum(["Nenhum", "Gerador", "Nobreak", "Rede Dupla"]).optional(),
  cell_signal_quality: z.enum(["Bom", "Razoável", "Ruim", "Inexistente"]).optional(),
  power_outlets_desc: z.string().optional(),
  equipment_space: z.enum(["Adequado", "Restrito", "Crítico"]).optional(),
  water_source: z.string().optional(),
  adapted_bathroom: z.boolean().default(false),
  stay_location: z.string().optional(),
  pets: z.any().optional(), // Legado: pode ser descrições ou JSON
  notes: z.string().optional(),
  
  // Legados que seguem existindo na UI atual
  bed_type: z.string().optional(),
  mattress_type: z.string().optional(),
  voltage: z.string().optional(),
  backup_power_source: z.string().optional(),
  pets_description: z.string().optional(),
  animals_behavior: z.string().optional(),
  general_observations: z.string().optional(),
  
  // Membros (Array para gerenciar a sub-tabela)
  household_members: z.array(HouseholdMemberSchema).optional(),
});

export type PatientAddressDTO = z.infer<typeof PatientAddressSchema>;

// Alias para o novo padrão de importação (camel no front, snake no back)
export const PatientAddressZ = PatientAddressSchema;
