'use client';

import { GedPanel } from "@/components/ged/GedPanel";

export function TabDocuments({ patient }: { patient: { id: string } }) {
  return <GedPanel patientId={patient.id} />;
}
