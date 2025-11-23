import { notFound } from 'next/navigation';
import { getPatientDetails } from '@/modules/patients/patient.data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, MapPin, Heartbeat, Users, Package, Files, CurrencyDollar, ClockCounterClockwise, Briefcase 
} from '@phosphor-icons/react/dist/ssr';

import { TabFinancial } from '@/modules/patients/components/tabs/TabFinancial';
import { TabPersonal } from '@/modules/patients/components/tabs/TabPersonal';
import { TabAddress } from '@/modules/patients/components/tabs/TabAddress';
import { TabGeneral } from '@/modules/patients/components/tabs/TabGeneral';
import { TabClinical } from '@/modules/patients/components/tabs/TabClinical';
import { TabTeam } from '@/modules/patients/components/tabs/TabTeam';
import { TabInventory } from '@/modules/patients/components/tabs/TabInventory';
import { TabAdministrative } from '@/modules/patients/components/tabs/TabAdministrative';
import { TabDocuments } from '@/modules/patients/components/tabs/TabDocuments';
import { TabHistory } from '@/modules/patients/components/tabs/TabHistory';

export const dynamic = 'force-dynamic';

// Correção da tipagem para Next.js 15
interface PatientDetailsPageProps {
    params: Promise<{ patientId: string }>;
}

export default async function PatientDetailsPage({ params }: PatientDetailsPageProps) {
    // 1. Await no params antes de usar (Regra do Next.js 15)
    const { patientId } = await params;

    // 2. Busca usando o ID desenrolado
    const patient = await getPatientDetails(patientId);

    if (!patient) return notFound();
    
    const initials = patient.full_name.split(' ').map((n: string) => n[0]?.toUpperCase()).slice(0, 2).join('');
    const contractor = patient.contractor as any;
    const contractorName = Array.isArray(contractor)
        ? contractor[0]?.name || 'Particular'
        : contractor?.name || 'Particular';

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* HEADER DO PACIENTE */}
            <div className="bg-white border-b px-8 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <Avatar className="h-20 w-20 border-4 border-slate-50 bg-[#0F2B45] text-white shadow-sm">
                            <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-[#0F2B45]">{patient.full_name}</h1>
                                <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                                    {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <span>CPF: {patient.cpf || '--'}</span>
                                <span className="text-slate-300">|</span>
                                <span>Contrato: <strong className="text-slate-700">{contractorName}</strong></span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">Ações Rápidas</Button>
                        <Button className="bg-[#D46F5D] hover:bg-[#D46F5D]/90">Abrir Prontuário</Button>
                    </div>
                </div>
            </div>

            {/* ÁREA DE CONTEÚDO (ABAS) */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <Tabs defaultValue="personal" className="w-full space-y-6">
                    <div className="relative">
                        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 pb-2 border-b border-slate-200 rounded-none no-scrollbar">
                            <TabTriggerItem value="general" label="Visão Geral" icon={User} />
                            <TabTriggerItem value="personal" label="Dados Pessoais" icon={User} />
                            <TabTriggerItem value="address" label="Endereço" icon={MapPin} />
                            <TabTriggerItem value="clinical" label="Dados Clínicos" icon={Heartbeat} />
                            <TabTriggerItem value="team" label="Rede de Apoio" icon={Users} />
                            <TabTriggerItem value="inventory" label="Estoque" icon={Package} />
                            <TabTriggerItem value="administrative" label="Administrativo" icon={Briefcase} />
                            <TabTriggerItem value="financial" label="Financeiro" icon={CurrencyDollar} />
                            <TabTriggerItem value="documents" label="Documentos" icon={Files} count={patient.documents?.length ?? 0} />
                            <TabTriggerItem value="history" label="Histórico" icon={ClockCounterClockwise} />
                        </TabsList>
                    </div>

                    <TabsContent value="general"><TabGeneral patient={patient} /></TabsContent>
                    <TabsContent value="personal"><TabPersonal patient={patient} /></TabsContent>
                    <TabsContent value="address"><TabAddress patient={patient} /></TabsContent>
                    <TabsContent value="clinical"><TabClinical patient={patient} /></TabsContent>
                    <TabsContent value="team"><TabTeam patient={patient} /></TabsContent>
                    <TabsContent value="inventory"><TabInventory patient={patient} /></TabsContent>
                    <TabsContent value="administrative"><TabAdministrative patient={patient} /></TabsContent>
                    <TabsContent value="financial"><TabFinancial patient={patient} /></TabsContent>
                    <TabsContent value="documents"><TabDocuments patient={patient} /></TabsContent>
                    <TabsContent value="history"><TabHistory patient={patient} /></TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function TabTriggerItem({ value, label, icon: Icon, count }: any) {
    return (
        <TabsTrigger 
            value={value}
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 data-[state=active]:border-[#0F2B45] data-[state=active]:text-[#0F2B45] transition-all bg-transparent shadow-none"
        >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            {count !== undefined && count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{count}</Badge>
            )}
        </TabsTrigger>
    )
}
