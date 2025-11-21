import { z } from "zod";

export const HouseholdMemberSchema = z.object({
  id: z.string().uuid().optional(), // Opcional para novos
  name: z.string().min(2, "Nome obrigatório"),
  role: z.string().min(2, "Função obrigatória"),
  type: z.enum(["resident", "caregiver"]),
  schedule_note: z.string().optional(),
});

export const PatientAddressSchema = z.object({
  patient_id: z.string().uuid(),
  
  // Tabela patient_addresses
  zip_code: z.string().min(8, "CEP inválido"),
  street: z.string().min(2, "Rua obrigatória"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF inválida"),
  reference_point: z.string().optional(),
  zone_type: z.enum(["Urbana", "Rural", "Comunidade", "Risco"]).optional(),
  travel_notes: z.string().optional(),
  
  // Tabela patient_domiciles
  ambulance_access: z.string().optional(),
  team_parking: z.string().optional(),
  night_access_risk: z.enum(["Baixo", "Médio", "Alto"]).optional(),
  entry_procedure: z.string().optional(),
  
  bed_type: z.string().optional(),
  mattress_type: z.string().optional(),
  voltage: z.string().optional(),
  has_wifi: z.boolean().default(false),
  has_smokers: z.boolean().default(false),
  pets_description: z.string().optional(),
  animals_behavior: z.string().optional(),
  
  // Membros (Array para gerenciar a sub-tabela)
  household_members: z.array(HouseholdMemberSchema).optional(),
});

export type PatientAddressDTO = z.infer<typeof PatientAddressSchema>;
