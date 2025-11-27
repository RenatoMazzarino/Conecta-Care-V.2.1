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
  
  // Regras de Cobrança (expandidas)
  billing_model: z.string().optional(),          // Mensalidade, Diária, Plantão...
  billing_base_value: z.coerce.number().optional(),
  billing_periodicity: z.string().optional(),
  monthly_fee: z.coerce.number().min(0).optional(), // legado
  billing_due_day: z.coerce.number().min(1).max(31).nullable().optional(),
  payment_method: z.string().optional(),
  payment_terms: z.string().optional(),
  copay_percent: z.coerce.number().optional(),
  readjustment_index: z.string().optional(),
  readjustment_month: z.coerce.number().optional(),
  late_fee_percent: z.coerce.number().optional(),
  daily_interest_percent: z.coerce.number().optional(),
  discount_early_payment: z.coerce.number().optional(),
  discount_days_limit: z.coerce.number().optional(),
  
  // Responsável
  financial_responsible_name: z.string().optional(),
  financial_responsible_contact: z.string().optional(), // Email ou Telefone
  payer_relation: z.string().optional(),
  billing_email_list: z.string().optional(),
  billing_phone: z.string().optional(),
  invoice_delivery_method: z.string().optional(),
  
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
