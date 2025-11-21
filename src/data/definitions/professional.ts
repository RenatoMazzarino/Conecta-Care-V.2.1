import { z } from "zod";

export const ProfessionalRoleEnum = z.enum(['nurse', 'technician', 'caregiver', 'physio', 'medic', 'coordinator']);
export const BondTypeEnum = z.enum(['clt', 'pj', 'cooperative', 'freelancer']);

export const ProfessionalSchema = z.object({
  user_id: z.string().uuid().optional(), // Pode ser vinculado a um Auth User existente ou criado depois
  full_name: z.string().min(2, "Nome obrigatório"),
  social_name: z.string().optional(),
  cpf: z.string().min(11, "CPF inválido"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  
  role: ProfessionalRoleEnum,
  professional_license: z.string().optional(), // COREN/CRM
  
  bond_type: BondTypeEnum.optional(),
  is_active: z.boolean().default(true),
});

export type ProfessionalDTO = z.infer<typeof ProfessionalSchema>;
