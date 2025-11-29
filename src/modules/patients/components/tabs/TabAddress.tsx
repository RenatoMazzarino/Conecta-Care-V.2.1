'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PatientAddressZ, PatientAddressForm } from '@/schemas/patient.address';
import { upsertAddress } from '@/app/(app)/patients/actions.upsertAddress';
import { FullPatientDetails } from '@/modules/patients/patient.data';
import { useToast } from '@/hooks/use-toast';
import { useCep } from '@/hooks/use-cep';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Truck, Shield, Lightning as Zap, FloppyDisk as Save } from '@phosphor-icons/react';

export function TabAddress({ patient }: { patient: FullPatientDetails }) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { fetchCep, loading: isFetchingCep } = useCep();
  const [lastCepLookup, setLastCepLookup] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  const addr = (patient.address?.[0] as any) ?? {};
  const dom = (patient.domicile?.[0] as any) ?? {};

  const defaultValues: PatientAddressForm = {
    patientId: patient.id,
    tenantId: (patient as any)?.tenant_id,
    zipCode: addr.zip_code || '',
    addressLine: addr.street || '',
    number: addr.number || '',
    neighborhood: addr.neighborhood || '',
    city: addr.city || '',
    state: addr.state || '',
    complement: addr.complement || '',
    referencePoint: addr.reference_point || '',
    zoneType: addr.zone_type || 'Urbana',
    travelNotes: addr.travel_notes || dom.travel_notes || '',
    geoLat: addr.geo_lat || addr.geo_latitude || undefined,
    geoLng: addr.geo_lng || addr.geo_longitude || undefined,
    geoLatitude: addr.geo_latitude || undefined,
    geoLongitude: addr.geo_longitude || undefined,
    propertyType: addr.property_type || undefined,
    condoName: addr.condo_name || '',
    blockTower: addr.block_tower || '',
    floorNumber: addr.floor_number || undefined,
    unitNumber: addr.unit_number || '',
    ambulanceAccess: dom.ambulance_access || 'Total',
    wheelchairAccess: addr.wheelchair_access || 'Nao_avaliado',
    elevatorStatus: addr.elevator_status || 'Nao_informado',
    streetAccessType: addr.street_access_type || 'Nao_informado',
    parking: addr.parking || '',
    teamParking: dom.team_parking || '',
    has24hConcierge: addr.has_24h_concierge ?? false,
    conciergeContact: addr.concierge_contact || '',
    entryProcedure: addr.entry_procedure || dom.entry_procedure || '',
    nightAccessRisk: addr.night_access_risk || dom.night_access_risk || 'Nao_avaliado',
    areaRiskType: addr.area_risk_type || 'Nao_avaliado',
    worksOrObstacles: addr.works_or_obstacles || '',
    hasWifi: addr.has_wifi ?? dom.has_wifi ?? false,
    hasSmokers: addr.has_smokers ?? dom.has_smokers ?? false,
    electricInfra: addr.electric_infra || dom.electric_infra || 'Nao_informada',
    backupPower: addr.backup_power || 'Nao_informado',
    cellSignalQuality: addr.cell_signal_quality || 'Nao_informado',
    powerOutletsDesc: addr.power_outlets_desc || '',
    equipmentSpace: addr.equipment_space || 'Nao_avaliado',
    waterSource: addr.water_source || dom.water_source || 'Nao_informado',
    adaptedBathroom: addr.adapted_bathroom ?? false,
    stayLocation: addr.stay_location || '',
    pets: addr.pets || dom.pets_description || '',
    notes: addr.notes || dom.general_observations || '',
    bedType: addr.bed_type || dom.bed_type || 'Nao_informado',
    mattressType: addr.mattress_type || dom.mattress_type || 'Nao_informado',
    animalsBehavior: addr.animal_behavior || dom.animals_behavior || 'Nao_informado',
    voltage: dom.voltage || '',
    backupPowerSource: dom.backup_power_source || '',
    petsDescription: dom.pets_description || '',
    generalObservations: dom.general_observations || '',
  };

  const form = useForm<PatientAddressForm>({
    resolver: zodResolver(PatientAddressZ) as any,
    defaultValues,
  });

  const zipValue = form.watch('zipCode');

  const applyCepData = (data: { street: string; neighborhood: string; city: string; state: string }) => {
    form.setValue('addressLine', data.street || '', { shouldDirty: true });
    form.setValue('neighborhood', data.neighborhood || '', { shouldDirty: true });
    form.setValue('city', data.city || '', { shouldDirty: true });
    form.setValue('state', data.state || '', { shouldDirty: true });
  };

  const handleCepLookup = async (rawCep?: string, options: { silent?: boolean } = {}) => {
    const cep = rawCep ?? zipValue ?? '';
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      if (!options.silent) setCepError('Informe um CEP com 8 dígitos.');
      return;
    }
    const data = await fetchCep(cleanCep);
    if (!data) {
      if (!options.silent) setCepError('CEP não encontrado.');
      return;
    }
    setCepError(null);
    setLastCepLookup(cleanCep);
    form.setValue('zipCode', cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'), { shouldDirty: true });
    applyCepData(data);
    if (!options.silent) {
      toast('CEP encontrado', { description: `${data.street}, ${data.neighborhood} - ${data.city}/${data.state}` });
    }
  };

  useEffect(() => {
    const clean = (zipValue || '').replace(/\D/g, '');
    if (clean.length === 8 && clean !== lastCepLookup) {
      void handleCepLookup(clean, { silent: true });
    }
  }, [zipValue, lastCepLookup]);

  useEffect(() => {
    if (cepError) setCepError(null);
  }, [zipValue, cepError]);

  async function onSubmit(data: PatientAddressForm) {
    setIsSaving(true);
    try {
      const res = await upsertAddress(data);
      if (res?.success === false) throw new Error(res.error);
      toast("Endereço salvo", { description: "Dados de logística atualizados com sucesso." });
    } catch (error) {
      console.error(error);
      toast("Erro ao salvar", { description: "Tente novamente.", action: { label: "Fechar", onClick: () => {} } });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-800">Endereço & Imóvel</CardTitle>
                    <CardDescription>Dados geográficos e tipologia do domicílio.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="h-40 bg-slate-100 rounded-md border border-slate-200 relative flex items-center justify-center text-slate-400 text-sm font-semibold mb-2">
                  <span>Mapa / Street View</span>
                  <button type="button" className="absolute bottom-2 right-2 text-xs font-semibold text-[#0F2B45] bg-white border border-slate-200 rounded px-3 py-1 shadow-sm">
                    Ver no mapa
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4">
                    <FormField control={form.control} name="zipCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} placeholder="00000-000" />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCepLookup(field.value)}
                            disabled={isFetchingCep}
                          >
                            {isFetchingCep ? 'Buscando...' : 'Buscar CEP'}
                          </Button>
                        </div>
                        <FormMessage />
                        {cepError && <p className="text-xs text-rose-600">{cepError}</p>}
                      </FormItem>
                    )} />
                  </div>
                  <div className="col-span-8">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-12">
                    <FormField control={form.control} name="addressLine" render={({ field }) => (
                      <FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-4">
                    <FormField control={form.control} name="number" render={({ field }) => (
                      <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-8">
                    <FormField control={form.control} name="neighborhood" render={({ field }) => (
                      <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-4">
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} maxLength={2} className="uppercase" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="col-span-4">
                  <FormField control={form.control} name="zoneType" render={({ field }) => (
                    <FormItem><FormLabel>Zona</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Urbana">Urbana</SelectItem>
                      <SelectItem value="Rural">Rural</SelectItem>
                      <SelectItem value="Periurbana">Periurbana</SelectItem>
                      <SelectItem value="Comunidade">Comunidade</SelectItem>
                      <SelectItem value="Risco">Área de Risco</SelectItem>
                      <SelectItem value="Nao_informada">Não informado</SelectItem>
                    </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="geoLatitude" render={({ field }) => (
                    <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="geoLongitude" render={({ field }) => (
                    <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-4">
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Detalhes do Imóvel</h4>
                  <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="propertyType" render={({ field }) => (
                    <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="Casa">Casa</SelectItem>
                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                        <SelectItem value="Chacara_Sitio">Chácara/Sítio</SelectItem>
                        <SelectItem value="ILPI">ILPI</SelectItem>
                        <SelectItem value="Pensão">Pensão</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                        <SelectItem value="Nao_informado">Não informado</SelectItem>
                      </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                    <FormField control={form.control} name="condoName" render={({ field }) => (
                      <FormItem><FormLabel>Condomínio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="blockTower" render={({ field }) => (
                      <FormItem><FormLabel>Bloco</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="unitNumber" render={({ field }) => (
                      <FormItem><FormLabel>Apto/Unidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="complement" render={({ field }) => (
                    <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="referencePoint" render={({ field }) => (
                    <FormItem><FormLabel>Ponto de Referência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-800">Acessibilidade & Segurança</CardTitle>
                    <CardDescription>Informações críticas para transporte e ambulância.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="ambulanceAccess" render={({ field }) => (
                    <FormItem><FormLabel>Acesso Ambulância</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Total">Total</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                      <SelectItem value="Dificil">Difícil</SelectItem>
                      <SelectItem value="Nao_acessa">Não acessa</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="wheelchairAccess" render={({ field }) => (
                    <FormItem><FormLabel>Acesso Maca/Cadeira</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Livre">Livre</SelectItem>
                      <SelectItem value="Com restrição">Com restrição</SelectItem>
                      <SelectItem value="Incompatível">Incompatível</SelectItem>
                      <SelectItem value="Nao_avaliado">Não avaliado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="nightAccessRisk" render={({ field }) => (
                    <FormItem><FormLabel className={field.value === 'Alto' ? 'text-red-600' : ''}>Risco Noturno</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Nao_avaliado">Não avaliado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="floorNumber" render={({ field }) => (
                    <FormItem><FormLabel>Andar</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="elevatorStatus" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Elevador</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Não tem">Não tem</SelectItem>
                      <SelectItem value="Tem - Não comporta maca">Tem - Não comporta maca</SelectItem>
                      <SelectItem value="Tem - Comporta maca">Tem - Comporta maca</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="streetAccessType" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de Rua</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Rua Larga">Rua Larga</SelectItem>
                      <SelectItem value="Rua Estreita">Rua Estreita</SelectItem>
                      <SelectItem value="Rua sem Saída">Rua sem Saída</SelectItem>
                      <SelectItem value="Viela">Viela</SelectItem>
                      <SelectItem value="Estrada de Terra">Estrada de Terra</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="teamParking" render={({ field }) => (
                    <FormItem><FormLabel>Estacionamento Equipe</FormLabel><FormControl><Input {...field} placeholder="Ex: Na rua, fácil" /></FormControl></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <FormField control={form.control} name="has24hConcierge" render={({ field }) => (
                    <div className="flex items-center justify-between col-span-3 border p-3 rounded-md">
                      <div className="space-y-0.5">
                        <FormLabel>Portaria 24h</FormLabel>
                        <p className="text-xs text-slate-500">Existe controle de acesso noturno?</p>
                      </div>
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} />
                      </FormControl>
                    </div>
                  )} />
                  <FormField control={form.control} name="conciergeContact" render={({ field }) => (
                    <FormItem><FormLabel>Contato Portaria</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="entryProcedure" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Procedimento de Entrada</FormLabel><FormControl><Input {...field} placeholder="Ex: RG na portaria, senha 1234..." /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="worksOrObstacles" render={({ field }) => (
                  <FormItem><FormLabel>Notas de Viagem (Motorista)</FormLabel><FormControl><Textarea {...field} placeholder="Ex: Entrar pela portaria 2, rua esburacada..." className="h-20" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="travelNotes" render={({ field }) => (
                  <FormItem><FormLabel>Observações de acesso</FormLabel><FormControl><Textarea {...field} placeholder="Detalhes adicionais de rota/acesso" className="h-20" /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-800">Segurança & Portaria</CardTitle>
                    <CardDescription>Controle de entrada e riscos.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="areaRiskType" render={({ field }) => (
                    <FormItem><FormLabel>Risco da Área</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="parking" render={({ field }) => (
                    <FormItem><FormLabel>Vaga / Garagem</FormLabel><FormControl><Input {...field} placeholder="Descrição breve" /></FormControl></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-fluent border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-800">Condições Ambientais</CardTitle>
                    <CardDescription>Energia, conectividade e leito.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="hasWifi" render={({ field }) => (
                    <div className="flex items-center space-x-2 border p-2 rounded"><FormControl><Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} /></FormControl><Label>Wi-Fi</Label></div>
                  )} />
                  <FormField control={form.control} name="hasSmokers" render={({ field }) => (
                    <div className="flex items-center space-x-2 border p-2 rounded"><FormControl><Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} /></FormControl><Label>Fumantes</Label></div>
                  )} />
                  <FormField control={form.control} name="adaptedBathroom" render={({ field }) => (
                    <div className="flex items-center space-x-2 border p-2 rounded"><FormControl><Checkbox checked={!!field.value} onCheckedChange={(val) => field.onChange(!!val)} /></FormControl><Label>Banheiro Adapt.</Label></div>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="electricInfra" render={({ field }) => (
                    <FormItem><FormLabel>Voltagem</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="110v">110v</SelectItem>
                      <SelectItem value="220v">220v</SelectItem>
                      <SelectItem value="Bivolt">Bivolt</SelectItem>
                      <SelectItem value="Instável">Instável</SelectItem>
                      <SelectItem value="Nao_informada">Não informada</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="cellSignalQuality" render={({ field }) => (
                    <FormItem><FormLabel>Sinal Celular</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Bom">Bom</SelectItem>
                      <SelectItem value="Razoável">Razoável</SelectItem>
                      <SelectItem value="Ruim">Ruim</SelectItem>
                      <SelectItem value="Inexistente">Inexistente</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="backupPower" render={({ field }) => (
                    <FormItem><FormLabel>Fonte Reserva</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Nenhum">Nenhum</SelectItem>
                      <SelectItem value="Gerador">Gerador</SelectItem>
                      <SelectItem value="Nobreak">Nobreak</SelectItem>
                      <SelectItem value="Rede Dupla">Rede Dupla</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="equipmentSpace" render={({ field }) => (
                    <FormItem><FormLabel>Espaço p/ Equip.</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Adequado">Adequado</SelectItem>
                      <SelectItem value="Restrito">Restrito</SelectItem>
                      <SelectItem value="Critico">Crítico</SelectItem>
                      <SelectItem value="Nao_avaliado">Não avaliado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="powerOutletsDesc" render={({ field }) => (
                    <FormItem><FormLabel>Tomadas no leito</FormLabel><FormControl><Input {...field} placeholder="Ex: 2 livres" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="waterSource" render={({ field }) => (
                    <FormItem><FormLabel>Fonte de água</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Rede_publica">Rede pública</SelectItem>
                      <SelectItem value="Poco_artesiano">Poço artesiano</SelectItem>
                      <SelectItem value="Cisterna">Cisterna</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="bedType" render={({ field }) => (
                    <FormItem><FormLabel>Tipo de cama/leito</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Hospitalar">Hospitalar</SelectItem>
                      <SelectItem value="Articulada">Articulada</SelectItem>
                      <SelectItem value="Comum">Comum</SelectItem>
                      <SelectItem value="Colchao_no_chao">Colchão no chão</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                  <FormField control={form.control} name="mattressType" render={({ field }) => (
                    <FormItem><FormLabel>Colchão</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Pneumatico">Pneumático</SelectItem>
                      <SelectItem value="Viscoelastico">Viscoelástico</SelectItem>
                      <SelectItem value="Espuma_comum">Espuma comum</SelectItem>
                      <SelectItem value="Mola">Mola</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="petsDescription" render={({ field }) => (
                    <FormItem><FormLabel>Animais</FormLabel><FormControl><Input {...field} placeholder="Animais de estimação" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="animalsBehavior" render={({ field }) => (
                    <FormItem><FormLabel>Comportamento</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>
                      <SelectItem value="Doces">Doces</SelectItem>
                      <SelectItem value="Bravos">Bravos</SelectItem>
                      <SelectItem value="Necessitam_contencao">Necessitam contenção</SelectItem>
                      <SelectItem value="Nao_informado">Não informado</SelectItem>
                    </SelectContent></Select></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Observações Gerais</FormLabel><FormControl><Textarea {...field} placeholder="Regras da casa, observações importantes" /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t mt-6">
          <Button type="submit" disabled={isSaving} className="min-w-[180px]">
            {isSaving ? "Salvando..." : (<><Save className="w-4 h-4 mr-2" />Salvar Alterações</>)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
