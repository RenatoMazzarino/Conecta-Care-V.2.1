import { notFound } from "next/navigation";
import { getPatientDetails } from "@/modules/patients/patient.data";
import { PatientTabsLayout } from "@/modules/patients/components/PatientTabsLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  FloppyDisk,
  Printer,
  ShareNetwork,
  Prohibit,
  DotsThree,
  ClockCounterClockwise,
  WarningOctagon,
  MapPin
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientDetailsPage({ params }: { params: { patientId: string } }) {
  const { patientId } = params;
  const patient = await getPatientDetails(patientId);

  if (!patient) return notFound();

  const initials = patient.full_name.substring(0, 2).toUpperCase();
  const birth = patient.date_of_birth ? new Date(patient.date_of_birth) : null;
  const age = birth ? new Date().getFullYear() - birth.getFullYear() : "N/D";
  const contractorName = Array.isArray(patient.contractor)
    ? patient.contractor[0]?.name || "Particular"
    : patient.contractor?.name || "Particular";
  const complexity = patient.clinical?.[0]?.complexity_level;
  const isHighComplexity = complexity === "high" || complexity === "critical";

  return (
    <div className="min-h-screen bg-[#faf9f8]">
      {/* Barra de ações fixa */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <Button variant="ghost" size="sm" className="text-sm font-semibold text-[#0F2B45] hover:bg-[#0F2B45]/5 gap-2">
            <FloppyDisk weight="bold" size={16} /> Salvar e Fechar
          </Button>
          <Button variant="ghost" size="sm" className="text-sm font-semibold text-gray-700 gap-2">
            <Printer size={16} /> Imprimir Ficha
          </Button>
          <Button variant="ghost" size="sm" className="text-sm font-semibold text-gray-700 gap-2">
            <ShareNetwork size={16} /> Compartilhar
          </Button>
          <Button variant="ghost" size="sm" className="text-sm font-semibold text-rose-700 hover:bg-rose-50 gap-2">
            <Prohibit size={16} /> Inativar
          </Button>
          <Button variant="ghost" size="sm" className="text-sm font-semibold text-gray-700 gap-1">
            <DotsThree size={20} /> Mais
          </Button>
        </div>
        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 uppercase tracking-wide">
          <ClockCounterClockwise weight="fill" /> Última alteração: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Hero do paciente */}
      <div className="bg-white px-8 pt-8 pb-2 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between max-w-[1600px] mx-auto gap-6 pb-4">
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                <AvatarFallback className="bg-gray-100 text-2xl font-bold text-gray-400">{initials}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-1 right-1 w-4 h-4 border-[3px] border-white rounded-full",
                  patient.status === "active" ? "bg-green-500" : "bg-gray-400"
                )}
                title={`Status: ${patient.status}`}
              />
            </div>
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {patient.administrative?.[0]?.admission_type?.replace("_", " ") || "Home Care"}
                </span>
                {isHighComplexity && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <WarningOctagon weight="fill" /> Alta Complexidade
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-none">{patient.full_name}</h1>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Data nasc. (idade)</p>
                  <p className="font-semibold text-gray-900">
                    {patient.date_of_birth || "--"} ({age} anos)
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">CPF</p>
                  <p className="font-semibold text-gray-900">{patient.cpf || "--"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Matrícula / Convênio</p>
                  <p className="font-semibold text-blue-700 cursor-pointer hover:underline">{contractorName}</p>
                </div>
                {patient.address?.[0]?.city && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Cidade</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" /> {patient.address?.[0]?.city}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <div className="text-right px-4 py-2 bg-gray-50 rounded border border-gray-100 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold text-gray-400">Escala (Mês)</p>
              <p className="text-xl font-bold text-[#0F2B45]">
                98% <span className="text-xs font-normal text-gray-500">Coberta</span>
              </p>
            </div>
            <div className="text-right px-4 py-2 bg-gray-50 rounded border border-gray-100 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold text-gray-400">Financeiro</p>
              <p className="text-xl font-bold text-emerald-600">
                OK <span className="text-xs font-normal text-gray-500">Em dia</span>
              </p>
            </div>
          </div>
        </div>
        {/* Abas integradas logo após o cabeçalho */}
        <PatientTabsLayout patient={patient} embedded />
      </div>
    </div>
  );
}
