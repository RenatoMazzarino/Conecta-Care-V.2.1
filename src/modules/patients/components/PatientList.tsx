import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { DotsThreeVertical, PencilSimple, FileText } from "@phosphor-icons/react/dist/ssr"; // Ícones Server-Side
import Link from "next/link";

interface PatientListProps {
  data: any[]; // Tiparemos melhor depois com o retorno do Supabase
}

export function PatientList({ data }: PatientListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-slate-50">
        <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Data Nasc.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((patient) => (
            <TableRow key={patient.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-medium text-[#0F2B45]">
                {patient.full_name}
              </TableCell>
              <TableCell className="text-slate-500">
                {patient.cpf || '--'}
              </TableCell>
              <TableCell className="text-slate-500">
                {patient.date_of_birth 
                  ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') 
                  : '--'}
              </TableCell>
              <TableCell>
                <Badge variant={patient.record_status === 'active' ? 'default' : 'secondary'}
                       className={patient.record_status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                  {patient.record_status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <DotsThreeVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    
                    <DropdownMenuItem asChild>
                        <Link href={`/patients/${patient.id}`} className="cursor-pointer flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Abrir Prontuário
                        </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="text-slate-500 cursor-not-allowed">
                        <PencilSimple className="h-4 w-4" /> Editar (Em breve)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}