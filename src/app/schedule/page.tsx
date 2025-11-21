import { ScheduleDashboard } from "@/modules/schedule/components/ScheduleDashboard";

// Exportamos como dynamic para garantir que a data seja sempre atualizada no servidor
export const dynamic = 'force-dynamic'; 

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto">
        <ScheduleDashboard />
      </div>
    </div>
  );
}