import { z } from "zod";

// --- PERFIL FINANCEIRO (Editável na Aba) ---
export const BondEnum = z.enum(["Plano de Saúde", "Particular", "Convênio", "Público"]);
export const BillingStatusEnum = z.enum(["active", "suspended", "defaulting"]);

export const PatientFinancialProfileSchema = z.object({
  patient_id: z.string().uuid(),
  
  // Dados do Plano / Convênio
  bond_type: BondEnum.optional(),
  insurer_name: z.string().optional(),
  plan_name: z.string().optional(),
  insurance_card_number: z.string().optional(),
  insurance_card_validity: z.coerce.date().nullable().optional(),
  card_holder_name: z.string().optional(),
  
  // Regras de Cobrança
  monthly_fee: z.coerce.number().min(0).optional(),
  billing_due_day: z.coerce.number().min(1).max(31).nullable().optional(),
  payment_method: z.string().optional(), // Boleto, PIX, Cartão
  payment_terms: z.string().optional(),
  
  // Responsável
  financial_responsible_name: z.string().optional(),
  financial_responsible_contact: z.string().optional(), // Email ou Telefone
  
  // Gestão
  billing_status: BillingStatusEnum.optional().default("active"),
  notes: z.string().optional(),
});

export type PatientFinancialProfileDTO = z.infer<typeof PatientFinancialProfileSchema>;

// --- TRANSAÇÃO FINANCEIRA (Leitura para o Extrato) ---
// Não salvamos isso pela aba, apenas lemos.
export type FinancialRecordDTO = {
  id: string;
  type: 'receivable' | 'payable';
  amount: number;
  due_date: string;
  payment_date?: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  description?: string | null;
  competence_date?: string | null; // Para agrupar por mês
};
