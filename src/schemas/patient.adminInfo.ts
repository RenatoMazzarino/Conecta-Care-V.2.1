import { z } from "zod";

export const PatientAdminInfoZ = z.object({
  patient_id: z.string().uuid(),
  tenant_id: z.string().uuid(),

  // Contrato & vigência
  status: z.string().optional(),
  status_reason: z.string().optional(),
  status_changed_at: z.string().datetime().optional(),
  admissionType: z.string().optional(),
  demandOrigin: z.enum(["Particular", "Operadora", "SUS", "Empresa", "Judicial", "Outro"]).optional(),
  primaryPayerType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  renewalType: z.string().optional(),
  contractId: z.string().optional(),
  externalContractId: z.string().optional(),
  authorizationNumber: z.string().optional(),
  judicialCaseNumber: z.string().optional(),

  // Responsáveis
  supervisorId: z.string().optional(),
  escalistaId: z.string().optional(),
  commercialResponsibleId: z.string().optional(),
  contractManagerId: z.string().optional(),

  // Escala
  frequency: z.string().optional(),
  scaleMode: z.string().optional(),
  scaleRuleStartDate: z.string().optional(),
  scaleRuleEndDate: z.string().optional(),
  scaleNotes: z.string().max(500).optional(),

  // Checklist
  chkContractOk: z.boolean().default(false),
  chkContractAt: z.string().optional(),
  chkContractBy: z.string().optional(),
  chkConsentOk: z.boolean().default(false),
  chkConsentAt: z.string().optional(),
  chkConsentBy: z.string().optional(),
  chkMedicalReportOk: z.boolean().default(false),
  chkMedicalReportAt: z.string().optional(),
  chkMedicalReportBy: z.string().optional(),
  chkLegalDocsOk: z.boolean().default(false),
  chkFinancialDocsOk: z.boolean().default(false),
  chkJudicialOk: z.boolean().default(false),
  checklistNotes: z.string().optional(),
});

export type PatientAdminInfoForm = z.infer<typeof PatientAdminInfoZ>;
