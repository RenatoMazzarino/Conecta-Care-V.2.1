import Link from "next/link";
import { BulkImportPage } from "@/modules/patients/components/BulkImportPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileCsv } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/patients" className="text-xs font-bold text-slate-500 hover:text-[#0F2B45] flex items-center gap-1 mb-2">
              <ArrowLeft /> Voltar para Lista
            </Link>
            <h1 className="text-3xl font-bold text-[#0F2B45] tracking-tight flex items-center gap-3">
              <FileCsv weight="duotone" className="opacity-80" /> Importação em Massa
            </h1>
            <p className="text-slate-500 mt-1">Carregue planilhas para cadastrar múltiplos pacientes de uma vez.</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/template-importacao.xlsx" target="_blank" rel="noopener noreferrer">
              <FileCsv /> Baixar Modelo
            </Link>
          </Button>
        </div>

        <BulkImportPage />
      </div>
    </div>
  );
}
