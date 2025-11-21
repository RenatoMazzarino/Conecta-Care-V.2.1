'use client';

import * as React from 'react';
import { ShiftMonitorSheet } from './ShiftMonitorSheet';
import { getLiveShiftMonitorData } from '../data';
import { Loader2 } from 'lucide-react'; // Usamos Loader2 do Lucide para o loading
import type { ShiftMonitorDataDTO } from '@/data/definitions/schedule';

interface ShiftMonitorWrapperProps {
    shiftId: string;
}

export function ShiftMonitorWrapper({ shiftId }: ShiftMonitorWrapperProps) {
    const [open, setOpen] = React.useState(false);
    const [data, setData] = React.useState<ShiftMonitorDataDTO | undefined>(undefined);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleOpenChange = (newOpen: boolean): void => {
        setOpen(newOpen);
        if (newOpen && shiftId) {
            // IIFE async para evitar que a função retorne Promise
            void (async () => {
                setIsLoading(true);
                const liveData = await getLiveShiftMonitorData(shiftId);
                setData(liveData ?? undefined);
                setIsLoading(false);
            })();
        } else {
            setData(undefined);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }
    
    return (
        <>
            <button 
                onClick={() => handleOpenChange(true)}
                className="text-sm text-[#D46F5D] font-semibold hover:text-[#0F2B45] transition"
            >
                Abrir Monitor
            </button>
            <ShiftMonitorSheet 
                open={open} 
                onOpenChange={handleOpenChange} 
                data={data}
                // Função mock para notas internas (apenas console.log no momento)
                onCreateInternalNote={(note: string) => console.log(`[Nova Nota Interna]: ${note}`)}
            />
        </>
    );
}