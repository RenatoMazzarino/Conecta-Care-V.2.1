import { z } from "zod";

export const AdmissionTypeEnum = z.enum(['home_care', 'paliativo', 'procedimento_pontual', 'reabilitacao']);
export const ContractStatusEnum = z.enum(['active', 'suspended', 'expired', 'negotiating']);
export const ScheduleSchemeEnum = z.enum(['12x36', '24x48', 'daily_12h', 'daily_24h', 'custom']);
export const ProfessionalRoleEnum = z.enum(['nurse', 'technician', 'caregiver']);

export const PatientAdministrativeSchema = z.object({
  patient_id: z.string().uuid(),
  
  // Vigência
  admission_date: z.coerce.date().optional(),
  discharge_prediction_date: z.coerce.date().optional(),
  discharge_date: z.coerce.date().optional(),
  
  // Classificação
  admission_type: AdmissionTypeEnum.optional(),
  service_package_name: z.string().optional(),
  
  // Contrato
  contract_number: z.string().optional(),
  contract_status: ContractStatusEnum.default('active'),
  
  // Responsáveis (Texto livre ou select no futuro)
  technical_supervisor_name: z.string().optional(),
  administrative_contact_name: z.string().optional(),

  // Regras operacionais de escala
  scheme_type: ScheduleSchemeEnum.optional().default('12x36'),
  day_start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default("07:00"),
  night_start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default("19:00"),
  professionals_per_shift: z.coerce.number().min(1).default(1),
  required_role: ProfessionalRoleEnum.optional().default('technician'),
  auto_generate: z.boolean().default(true),
});

export type PatientAdministrativeDTO = z.infer<typeof PatientAdministrativeSchema>;
