import { z } from "zod";

export const AdmissionTypeEnum = z.enum(['home_care', 'paliativo', 'procedimento_pontual', 'reabilitacao']);
export const ContractStatusEnum = z.enum(['active', 'suspended', 'expired', 'negotiating']);

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
});

export type PatientAdministrativeDTO = z.infer<typeof PatientAdministrativeSchema>;
