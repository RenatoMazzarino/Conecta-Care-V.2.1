"use server";

import { upsertAddressAction } from "@/modules/patients/actions.upsertAddress";

// Wrapper para manter compatibilidade de importação
export { upsertAddressAction as upsertAddress };
