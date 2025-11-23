import { z } from "zod";

export const ProfessionalRoleEnum = z.enum(['nurse', 'technician', 'caregiver', 'physio', 'medic', 'coordinator']);
export const BondTypeEnum = z.enum(['clt', 'pj', 'cooperative', 'freelancer']);

export const ProfessionalSchema = z.object({
  user_id: z.string().uuid().optional(),
  full_name: z.string().min(2, "Nome obrigatório"),
  social_name: z.string().optional(),
  cpf: z.string().min(11, "CPF inválido"), // CPF é obrigatório
  
  // Aceita string vazia como "sem e-mail"
  email: z.union([z.literal(''), z.string().email("E-mail inválido")]).optional(),
  
  phone: z.string().optional(),
  
  role: ProfessionalRoleEnum,
  professional_license: z.string().optional(), // COREN/CRM
  
  bond_type: BondTypeEnum.optional(),
  is_active: z.boolean().default(true),
});

export type ProfessionalDTO = z.infer<typeof ProfessionalSchema>;
