import { notFound } from "next/navigation";
import { getPatientDetails } from "@/modules/patients/patient.data";
import { PatientTabsLayout } from "@/modules/patients/components/PatientTabsLayout";
import { PatientHeader } from "@/components/patients/v2/patient-header";
import { getPatientHeaderData } from "./actions.getHeader";

export const dynamic = "force-dynamic";

export default async function PatientDetailsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = await getPatientDetails(patientId);
  const headerData = await getPatientHeaderData(patientId);

  if (!patient) return notFound();

  return (
    <div className="min-h-screen bg-[#faf9f8]">
      <PatientHeader patientId={patient.id} headerData={headerData} fallbackPatient={patient} />
      <div className="bg-white px-0">
        <PatientTabsLayout patient={patient} embedded />
      </div>
    </div>
  );
}
