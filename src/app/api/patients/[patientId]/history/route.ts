import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PatientHistoryEvent } from "@/lib/audit/types";

// Referência conceitual: docs/AUDIT_PATIENT_HISTORY_PLAN.md (Fase B)
const LIMIT = 200;

type SystemAuditRow = {
  id: string;
  parent_patient_id: string | null;
  entity_table: string | null;
  entity_id: string | null;
  action: string;
  reason: string | null;
  changes: Record<string, any> | null;
  actor_id: string | null;
  route_path: string | null;
  created_at: string;
};

type DocumentAuditRow = {
  id: string | number;
  document_id: string;
  user_id: string | null;
  action: string;
  happened_at: string;
  details: Record<string, any> | null;
};

type DocumentMetaRow = {
  id: string;
  patient_id: string;
  title: string | null;
  category: string | null;
  domain_type: string | null;
  origin_module: string | null;
  status: string | null;
  version: number | null;
};

const MODULE_BY_TABLE: Record<string, PatientHistoryEvent["module"]> = {
  patients: "Paciente",
  patient_civil_documents: "Paciente",
  patient_admin_info: "Administrativo",
  patient_administrative_profiles: "Administrativo",
  patient_financial_profiles: "Financeiro",
  financial_records: "Financeiro",
  financial_ledger_entries: "Financeiro",
  patient_inventory: "Estoque",
  inventory_movements: "Estoque",
  patient_documents: "GED",
};

const getDocumentActionLabel = (action: string) => {
  const map: Record<string, string> = {
    "document.create": "Upload de documento",
    "document.update": "Atualização de documento",
    "document.version": "Nova versão",
    "document.view": "Visualização",
    "document.download": "Download",
    "document.archive": "Arquivamento",
    "document.restore": "Restauração",
  };
  return map[action] || action.replace("document.", "");
};

const parseList = (value: string | null) =>
  value?.split(",").map((item) => item.trim()).filter(Boolean);

const parseDate = (value: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const mapModule = (entityTable?: string | null): PatientHistoryEvent["module"] => {
  if (entityTable) {
    const normalized = entityTable.toLowerCase();
    if (MODULE_BY_TABLE[normalized]) return MODULE_BY_TABLE[normalized];
  }
  return "Sistema";
};

const buildSystemSummary = (row: SystemAuditRow) => {
  if (row.reason?.trim()) return row.reason.trim();
  return `${row.action} em ${row.entity_table || "registro"}`;
};

export async function GET(request: Request, context: { params: { patientId: string } }) {
  try {
    const { patientId } = await context.params;
    const searchParams = new URL(request.url).searchParams;
    const fromDate = parseDate(searchParams.get("from"));
    const toDate = parseDate(searchParams.get("to"));
    const modulesFilter = parseList(searchParams.get("modules"))?.map((m) => m.toLowerCase());
    const actionsFilter = parseList(searchParams.get("actions"))?.map((a) => a.toLowerCase());

    const supabase = await createClient();

    const systemPromise = supabase
      .from("system_audit_logs")
      .select(
        "id,parent_patient_id,entity_table,entity_id,action,reason,changes,actor_id,route_path,created_at",
      )
      .eq("parent_patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(LIMIT);

    const documentsPromise = supabase
      .from("patient_documents")
      .select("id,patient_id,title,category,domain_type,origin_module,status,version")
      .eq("patient_id", patientId)
      .limit(500);

    const [{ data: systemRows, error: systemError }, { data: documentMeta, error: documentsError }] = await Promise.all([
      systemPromise,
      documentsPromise,
    ]);

    if (systemError) console.error("history:system_audit_logs", systemError.message);
    if (documentsError) console.error("history:patient_documents", documentsError.message);

    let docRows: DocumentAuditRow[] = [];
    if (!documentsError && (documentMeta?.length || 0) > 0) {
      const docIds = (documentMeta || []).map((doc) => doc.id);
      const { data, error } = await supabase
        .from("patient_document_logs")
        .select("id,document_id,user_id,action,happened_at,details")
        .in("document_id", docIds)
        .order("happened_at", { ascending: false })
        .limit(LIMIT);
      if (error) {
        console.error("history:patient_document_logs", error.message);
      } else {
        docRows = data || [];
      }
    }

    const documentMap = new Map<string, DocumentMetaRow>();
    documentMeta?.forEach((doc) => {
      documentMap.set(doc.id, doc as DocumentMetaRow);
    });

    const systemEvents: PatientHistoryEvent[] = (systemRows || []).map((row: SystemAuditRow) => ({
      id: row.id,
      occurredAt: row.created_at,
      patientId: row.parent_patient_id || patientId,
      module: mapModule(row.entity_table),
      action: row.action,
      source: {
        entityTable: row.entity_table || undefined,
        entityId: row.entity_id || undefined,
        routePath: row.route_path || undefined,
      },
      actor: row.actor_id ? { userId: row.actor_id, name: undefined, role: undefined } : undefined,
      summary: buildSystemSummary(row),
      details: row.changes || undefined,
    }));

    const documentEvents: PatientHistoryEvent[] = (docRows || []).map((row: DocumentAuditRow) => {
      const docInfo = documentMap.get(row.document_id);
      const actionLabel = getDocumentActionLabel(row.action);
      const summaryCategory = docInfo?.category || "Sem categoria";
      const summaryDomain = docInfo?.domain_type || "Sem domínio";

      return {
        id: String(row.id),
        occurredAt: row.happened_at,
        patientId: docInfo?.patient_id || patientId,
        module: "GED",
        action: row.action,
        source: {
          entityTable: "patient_documents",
          entityId: row.document_id,
          originTab: docInfo?.origin_module || undefined,
        },
        summary: `${actionLabel} – ${summaryCategory} (${summaryDomain})`,
        details:
          row.details ||
          (docInfo
            ? {
                title: docInfo.title,
                status: docInfo.status,
                version: docInfo.version,
                origin_module: docInfo.origin_module,
              }
            : undefined),
      };
    });

    const allEvents = [...systemEvents, ...documentEvents];

    const filteredByModules = modulesFilter?.length
      ? allEvents.filter((event) => modulesFilter.includes(event.module.toLowerCase()))
      : allEvents;

    const filteredByActions = actionsFilter?.length
      ? filteredByModules.filter((event) => actionsFilter.includes(event.action.toLowerCase()))
      : filteredByModules;

    const filteredByDate = filteredByActions.filter((event) => {
      const occurredAt = new Date(event.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) return false;
      if (fromDate && occurredAt < fromDate) return false;
      if (toDate && occurredAt > toDate) return false;
      return true;
    });

    const orderedEvents = filteredByDate.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    return NextResponse.json({ events: orderedEvents, total: orderedEvents.length });
  } catch (error) {
    console.error("history:unexpected", error);
    return NextResponse.json({ error: "Erro ao carregar histórico" }, { status: 500 });
  }
}
