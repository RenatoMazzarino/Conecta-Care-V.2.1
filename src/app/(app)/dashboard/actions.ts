'use server'

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardKPIsAction() {
  const supabase = await createClient();
  const now = new Date();
  
  // Define o período (Mês Atual)
  const start = startOfMonth(now).toISOString();
  const end = endOfMonth(now).toISOString();

  const { data, error } = await supabase
    .rpc('get_executive_kpis', { 
      start_date: start, 
      end_date: end 
    });

  if (error) {
    console.error("Erro KPI:", error);
    // Retorna zerado em caso de erro
    return {
        coverage: { rate: 0, total: 0, completed: 0, missed: 0, open: 0 },
        finance: { projected_revenue: 0 },
        alerts: { top_absent_name: '-', top_absent_count: 0 }
    };
  }

  return data;
}
