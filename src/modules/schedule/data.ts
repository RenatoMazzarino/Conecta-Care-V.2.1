import { ShiftMonitorDataDTO } from "@/data/definitions/schedule";

// No V2, vamos fazer um mock inicial para construir a UI,
// e depois conectar com o banco/telemetria.
export async function getLiveShiftMonitorData(shiftId: string): Promise<ShiftMonitorDataDTO | null> {
  if (shiftId !== 'mock-123') return null;

  // Dados Mockados para construir o painel visual
  const mockData: ShiftMonitorDataDTO = {
    shiftId: 'mock-123',
    patientName: 'Antônio da Silva',
    professional: {
      name: 'Dr. João Mendes',
      role: 'Enfermeiro Supervisor',
      initials: 'JM',
      phone: '19999999999',
      bleStatus: 'connected',
      battery: 88,
    },
    shiftWindow: {
      start: '19:00',
      end: '07:00',
      startedAt: '19:05',
    },
    status: 'Jornada OK',
    progress: 15,
    timeline: [
      {
        id: 'evt-1',
        time: '19:05',
        title: 'Check-in Aprovado',
        description: 'Verificação facial e GPS confirmaram a presença no local.',
        iconName: 'ShieldCheck', // Nome do ícone Phosphor
        tone: 'success',
      },
      {
        id: 'evt-2',
        time: '19:15',
        title: 'Beacon Conectado',
        description: 'Dispositivo Bluetooth (Beacon) detectado, sinalizando permanência na residência.',
        iconName: 'BluetoothConnected',
        tone: 'default',
      },
    ],
    notes: [
      {
        id: 'note-1',
        author: 'Coord. Fabiana',
        timestamp: '15:30',
        message: 'Lembrar de verificar se a sonda foi trocada na última visita, conforme orientação.',
        variant: 'default',
      },
    ],
  };

  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockData;
}