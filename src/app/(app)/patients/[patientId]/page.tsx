import { notFound } from "next/navigation";
import { getPatientDetails } from "@/modules/patients/patient.data";
import { PatientTabsLayout } from "@/modules/patients/components/PatientTabsLayout";
import { GedPanelProvider } from "@/components/ged/ged-panel-provider";
import { getPatientHeaderData } from "./actions.getHeader";

export const dynamic = "force-dynamic";

export default async function PatientDetailsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = await getPatientDetails(patientId);
  const headerData = await getPatientHeaderData(patientId);

  if (!patient) return notFound();

  const makePatientCode = (id?: string) => {
    if (!id) return null;
    const clean = id.replace(/-/g, "");
    const core = clean.slice(0, 8).toUpperCase();
    return `PAC-${core}`;
  };

  const fallbackName = patient.social_name || patient.full_name;
  const gedPatientInfo = {
    name: headerData?.identity.name || fallbackName,
    status: headerData?.identity.status || patient.record_status || patient.status,
    identifier: makePatientCode(patient.id),
  };

  return (
    <GedPanelProvider patientId={patient.id} patientInfo={gedPatientInfo}>
      <div className="min-h-screen bg-[#faf9f8]">
        <PatientTabsLayout patient={patient} embedded headerData={headerData} />
      </div>
    </GedPanelProvider>
  );
}
