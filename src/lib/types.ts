// Tipagens globais auxiliares

export type Patient = {
  id: string;
  full_name?: string | null;
  cpf?: string | null;
  status?: string | null;
};

// INTEGRATION & LOGGING TABLES
export type SystemAuditLog = {
  id: string; // uuid
  entity_table: string;
  entity_id: string; // uuid
  parent_patient_id?: string | null; // uuid
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  changes: Record<string, any> | null; // JSONB
  actor_id?: string | null; // uuid
  created_at: string; // timestamptz
  tenant_id?: string | null;
};

export type PatientCivilDocument = {
  id: string;
  patientId: string;
  docType: string;
  docNumber: string;
  issuer?: string | null;
  issuedAt?: string | null;
  validUntil?: string | null;
};

export type PatientHouseholdMember = {
  id?: string;
  name: string;
  role: string;
  type: 'resident' | 'caregiver';
  scheduleNote?: string | null;
};

export type PatientAddress = {
  id?: string;
  patientId: string;
  tenantId?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  referencePoint?: string | null;
  zoneType?: string | null;
  travelNotes?: string | null;
  geoLat?: number | null;
  geoLng?: number | null;

  propertyType?: 'Casa' | 'Apartamento' | 'Chácara/Sítio' | 'ILPI' | 'Pensão' | 'Outro' | null;
  condoName?: string | null;
  blockTower?: string | null;
  floorNumber?: number | null;
  unitNumber?: string | null;

  ambulanceAccess?: string | null;
  streetAccessType?: 'Rua Larga' | 'Rua Estreita' | 'Rua sem Saída' | 'Viela' | 'Estrada de Terra' | null;
  parking?: string | null;
  teamParking?: string | null;
  elevatorStatus?: 'Não tem' | 'Tem - Não comporta maca' | 'Tem - Comporta maca' | null;
  wheelchairAccess?: 'Livre' | 'Com restrição' | 'Incompatível' | null;
  externalStairs?: string | null;

  has24hConcierge?: boolean | null;
  conciergeContact?: string | null;
  entryProcedure?: string | null;
  nightAccessRisk?: 'Baixo' | 'Médio' | 'Alto' | null;
  areaRiskType?: 'Baixo' | 'Médio' | 'Alto' | null;
  worksOrObstacles?: string | null;

  hasWifi?: boolean | null;
  hasSmokers?: boolean | null;
  electricInfra?: '110v' | '220v' | 'Bivolt' | 'Instável' | null;
  backupPower?: 'Nenhum' | 'Gerador' | 'Nobreak' | 'Rede Dupla' | null;
  cellSignalQuality?: 'Bom' | 'Razoável' | 'Ruim' | 'Inexistente' | null;
  powerOutletsDesc?: string | null;
  equipmentSpace?: 'Adequado' | 'Restrito' | 'Crítico' | null;
  waterSource?: string | null;
  adaptedBathroom?: boolean | null;
  stayLocation?: string | null;
  pets?: any;
  notes?: string | null;

  bedType?: string | null;
  mattressType?: string | null;
  voltage?: string | null;
  backupPowerSource?: string | null;
  petsDescription?: string | null;
  animalsBehavior?: string | null;
  generalObservations?: string | null;

  householdMembers?: PatientHouseholdMember[];
};

export type PatientDetails = Patient & {
  nickname?: string | null;
  educationLevel?: string | null;
  profession?: string | null;
  raceColor?: string | null;
  isPcd?: boolean | null;
  placeOfBirthCity?: string | null;
  placeOfBirthState?: string | null;
  placeOfBirthCountry?: string | null;
  rgIssuerState?: string | null;
  rgIssuedAt?: string | null;
  docValidationStatus?: 'Pendente' | 'Validado' | 'Rejeitado' | null;
  docValidatedAt?: string | null;
  docValidatedBy?: string | null;
  docValidationMethod?: string | null;
  marketingConsentedAt?: string | null;
  marketingConsentSource?: string | null;
  marketingConsentIp?: string | null;
  civilDocuments?: PatientCivilDocument[];
};

export type PatientRelatedPerson = {
  id: string;
  patientId: string;
  tenantId?: string | null;
  fullName: string;
  relation?: string | null;
  priorityOrder?: number | null;
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  isWhatsapp?: boolean | null;
  email?: string | null;
  isLegalGuardian?: boolean | null;
  isFinancialResponsible?: boolean | null;
  isEmergencyContact?: boolean | null;
  canAccessRecords?: boolean | null;
  canAuthorizeProcedures?: boolean | null;
  canAuthorizeFinancial?: boolean | null;
  livesWithPatient?: string | null;
  hasKeys?: boolean | null;
  contactWindow?: string | null;
  preferredContact?: string | null;
  receiveUpdates?: boolean | null;
  receiveAdmin?: boolean | null;
  optOutMarketing?: boolean | null;
  notes?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  rg?: string | null;
  rgIssuer?: string | null;
  rgState?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
};

export type CareTeamMember = {
  id: string;
  patientId: string;
  tenantId?: string | null;
  professionalId: string;
  role: string;
  professionalCategory?: string | null;
  caseRole?: string | null;
  regime: string;
  employmentType?: string | null;
  shiftSummary?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  isTechnicalResponsible?: boolean | null;
  isFamilyFocalPoint?: boolean | null;
  isPrimary?: boolean | null;
  professional?: {
    full_name?: string | null;
    contact_phone?: string | null;
    avatar_url?: string | null;
  } | null;
};
