import { z } from "zod";

// --- PERFIL FINANCEIRO (Editável na Aba) ---
export const BondEnum = z.enum(["Plano de Saúde", "Particular", "Convênio", "Público"]);
export const BillingStatusEnum = z.enum(["active", "suspended", "defaulting"]);

// Enums rigidamente alinhados ao banco
export const BillingModelEnum = z.enum(["Mensalidade", "Diaria", "Plantao_12h", "Plantao_24h", "Visita", "Pacote_Fechado", "Outro"]);
export const BillingPeriodicityEnum = z.enum(["Mensal", "Quinzenal", "Semanal", "Por_Evento"]);
export const PaymentMethodEnum = z.enum(["Boleto", "Pix", "Transferencia", "Debito_Automatico", "Cartao_Credito", "Dinheiro", "Outro"]);
export const InvoiceDeliveryEnum = z.enum(["Email", "Portal", "WhatsApp", "Correio", "Nao_Envia"]);
export const LedgerStatusEnum = z.enum(["Aberto", "Pago", "Parcial", "Vencido", "Cancelado", "Em_Contestacao"]);
export const LedgerEntryTypeEnum = z.enum(["Cobranca_Recorrente", "Insumo_Extra", "Ajuste_Credito", "Ajuste_Debito", "Pagamento_Recebido"]);

export const PatientFinancialProfileSchema = z.object({
  patient_id: z.string().uuid(),
  responsible_related_person_id: z.string().uuid().optional(),
  
  // Dados do Plano / Convênio
  bond_type: BondEnum.optional(),
  insurer_name: z.string().optional(),
  plan_name: z.string().optional(),
  insurance_card_number: z.string().optional(),
  insurance_card_validity: z.coerce.date().nullable().optional(),
  card_holder_name: z.string().optional(),
  
  // Regras de Cobrança (expandidas)
  billing_model: BillingModelEnum.optional(),
  billing_base_value: z.coerce.number().optional(),
  billing_periodicity: BillingPeriodicityEnum.optional(),
  monthly_fee: z.coerce.number().min(0).optional(), // legado
  billing_due_day: z.coerce.number().min(1).max(31).nullable().optional(),
  payment_method: PaymentMethodEnum.optional(),
  payment_terms: z.string().optional(),
  copay_percent: z.coerce.number().optional(),
  readjustment_index: z.string().optional(),
  readjustment_month: z.coerce.number().optional(),
  late_fee_percent: z.coerce.number().optional(),
  daily_interest_percent: z.coerce.number().optional(),
  discount_early_payment: z.coerce.number().optional(),
  discount_days_limit: z.coerce.number().optional(),
  receiving_account_info: z.string().optional(),
  
  // Responsável
  financial_responsible_name: z.string().optional(),
  financial_responsible_contact: z.string().optional(), // Email ou Telefone
  payer_relation: z.string().optional(),
  billing_email_list: z.string().optional(),
  billing_phone: z.string().optional(),
  invoice_delivery_method: InvoiceDeliveryEnum.optional(),
  
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

export type LedgerEntryDTO = {
  id: string;
  description: string;
  amount_due: number;
  amount_paid?: number | null;
  due_date: string;
  paid_at?: string | null;
  entry_type?: z.infer<typeof LedgerEntryTypeEnum> | null;
  status: z.infer<typeof LedgerStatusEnum>;
  reference_period?: string | null;
  payment_method?: z.infer<typeof PaymentMethodEnum> | null;
};
