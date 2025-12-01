'use server';

import { upsertAddressAction, type UpsertAddressResult } from '@/modules/patients/actions.upsertAddress';
import type { PatientAddressForm } from '@/schemas/patient.address';

export async function upsertAddress(data: PatientAddressForm): Promise<UpsertAddressResult> {
	return upsertAddressAction(data);
}
