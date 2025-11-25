'use client';

import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import readXlsxFile, { Schema } from 'read-excel-file';
import { isValidCPF } from '@/lib/validation';
import { bulkImportPatientsAction, BulkImportPatient } from '../actions.bulk-import';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { CloudArrowUp, CheckCircle, WarningCircle, Spinner } from "@phosphor-icons/react";
import { useRouter } from 'next/navigation';

type ImportedRow = BulkImportPatient & { date_of_birth?: Date | string };

type ValidatedRow = ImportedRow & {
  cleanCpf: string;
  dobISO?: string;
  dobDisplay: string;
  isValid: boolean;
  errors: string[];
};

const schema = {
  'Nome Completo': { prop: 'full_name', type: String },
  'CPF': { prop: 'cpf', type: String },
  'Data Nascimento': { prop: 'date_of_birth', type: Date },
  'Gênero': { prop: 'gender', type: String },
  'Operadora': { prop: 'contractor_name', type: String }
} as unknown as Schema<ImportedRow>;

export function BulkImportPage() {
  const [fileData, setFileData] = useState<ImportedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const MAX_ROWS = 500;
  const MAX_SIZE_MB = 5;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo de ${MAX_SIZE_MB}MB.`);
      return;
    }

    readXlsxFile<ImportedRow>(file, { schema })
      .then(({ rows }) => {
        if (rows.length > MAX_ROWS) {
          toast.error(`Muitos registros. Limite de ${MAX_ROWS} pacientes por vez.`);
          return;
        }
        setFileData(rows);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Erro ao ler arquivo. Use o modelo padrão.");
      });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1
  });

  const validatedData = useMemo<ValidatedRow[]>(() => {
    return fileData.map((row) => {
      const cpf = String(row.cpf || '').replace(/\D/g, '');
      const isCpfValid = isValidCPF(cpf);
      const hasName = !!row.full_name;

      let dobDisplay = '-';
      let dobISO: string | undefined;

      const rawDob = row.date_of_birth as Date | string | undefined;
      if (rawDob instanceof Date) {
        dobISO = rawDob.toISOString().split('T')[0];
        dobDisplay = rawDob.toLocaleDateString('pt-BR');
      } else if (typeof rawDob === 'string') {
        dobDisplay = rawDob;
        dobISO = rawDob;
      }

      return {
        ...row,
        cleanCpf: cpf,
        dobISO,
        dobDisplay,
        isValid: isCpfValid && hasName,
        errors: [
          !isCpfValid && 'CPF Inválido',
          !hasName && 'Nome Obrigatório'
        ].filter(Boolean) as string[],
      };
    });
  }, [fileData]);

  const validCount = validatedData.filter((d) => d.isValid).length;
  const invalidCount = validatedData.length - validCount;

  const handleImport = async () => {
    const validRows: BulkImportPatient[] = validatedData
      .filter((d) => d.isValid)
      .map((d) => ({
        full_name: d.full_name,
        cpf: d.cleanCpf,
        date_of_birth: d.dobISO,
        gender: (() => {
          const g = (d.gender || "").toString().toLowerCase();
          if (g === "masculino" || g === "m") return "M";
          if (g === "feminino" || g === "f") return "F";
          return "Other";
        })(),
        contractor_name: d.contractor_name,
      }));

    if (validRows.length === 0) {
      toast.error("Nenhum dado válido.");
      return;
    }

    setUploading(true);
    const res = await bulkImportPatientsAction(validRows);
    setUploading(false);

    if (res.success) {
      toast.success(`${res.count} pacientes importados!`);
      setTimeout(() => router.push('/patients'), 1500);
    } else {
      toast.error("Erro na importação: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
        <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-[#0F2B45] bg-blue-50' : 'border-slate-300 hover:border-[#0F2B45] hover:bg-slate-50'}`}
        >
            <input {...getInputProps()} />
            <CloudArrowUp size={48} className="mx-auto text-slate-400 mb-4" weight="duotone"/>
            <p className="text-lg font-bold text-slate-700">Arraste a planilha Excel (.xlsx) aqui</p>
            <p className="text-sm text-slate-500">Use o modelo padrão para garantir a importação.</p>
        </div>

        {fileData.length > 0 && (
            <Card className="shadow-fluent border-slate-200">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex gap-4 text-sm font-bold">
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle weight="fill"/> {validCount} Válidos</span>
                            {invalidCount > 0 && <span className="text-rose-600 flex items-center gap-1"><WarningCircle weight="fill"/> {invalidCount} Erros</span>}
                        </div>
                        <Button onClick={handleImport} disabled={uploading || validCount === 0} className="bg-[#0F2B45] text-white">
                            {uploading ? <><Spinner className="animate-spin mr-2"/> Importando...</> : `Importar ${validCount} Pacientes`}
                        </Button>
                    </div>
                    
                    <div className="max-h-[500px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>CPF</TableHead>
                                    <TableHead>Nascimento</TableHead>
                                    <TableHead>Operadora</TableHead>
                                    <TableHead>Erros</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validatedData.map((row, i) => (
                                    <TableRow key={`${row.cleanCpf}-${i}`} className={!row.isValid ? 'bg-rose-50/50' : ''}>
                                        <TableCell>
                                            {row.isValid 
                                                ? <CheckCircle className="text-emerald-500" weight="fill"/> 
                                                : <WarningCircle className="text-rose-500" weight="fill"/>}
                                        </TableCell>
                                        <TableCell className="font-medium">{row.full_name}</TableCell>
                                        <TableCell className="font-mono text-xs">{row.cleanCpf}</TableCell>
                                        <TableCell>{row.dobDisplay}</TableCell>
                                        <TableCell>{row.contractor_name || '-'}</TableCell>
                                        <TableCell>
                                            {row.errors.length > 0 && (
                                                <Badge variant="destructive" className="text-[10px]">{row.errors.join(', ')}</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
