# AUDIT_PATIENT_HISTORY_PLAN

## 0. Objetivo e princípios

**Objetivo geral**
- Criar uma camada única de auditoria capaz de registrar tudo que acontece com o paciente (cadastro, documentos, financeiro, estoque, clínico etc.).
- Exibir isso como uma timeline completa na aba Histórico/Auditoria.
- Garantir rastreabilidade jurídica: quem fez, quando, onde e o que mudou.

**Princípios**
- `system_audit_logs` é a verdade única de eventos globais; logs específicos (ex.: GED) continuam existindo, sempre relacionáveis ao paciente.
- Nada de duplicar dado funcional: auditoria registra apenas "o que aconteceu".
- Primeira fase só leitura; migrations novas só depois de validar a real necessidade.
- Sempre consultar os snapshots oficiais para qualquer decisão de schema:
  - `db/snapshots/conectacare-2025-11-29.sql`
  - `db/snapshots/conectacare-2025-11-29.json`
  Esses arquivos são **fonte de verdade** e não devem ser aplicados como migrations.

## 1. Preparação / Fundos

### 1.1 Snapshot como referência
- Usar os dois snapshots acima sempre que precisarmos confirmar tabelas, colunas, tipos, RLS e dados auxiliares.
- Não gerar migrations automáticas a partir desse dump e nem tentar "sincronizar" o banco com ele.

### 1.2 Documento de plano
- Este próprio arquivo consolida o plano e deve ser mantido atualizado.
- Tabelas de auditoria/log já existentes e confirmadas no snapshot:
  - `public.system_audit_logs` (repositório principal de eventos de sistema).
  - `public.patient_document_logs` (auditoria granular do GED).
  - Outras potenciais para consulta futura: `public.shift_timeline_events`, `public.financial_ledger_entries`, `public.inventory_movements`.

## 2. Fase A – Modelo de auditoria global (sem mexer no banco)

### 2.1 Mapear o que já existe
- **`system_audit_logs`**
  - Campos principais (confirmar no snapshot sempre que necessário): `id`, `tenant_id`, `parent_patient_id`, `entity_table`, `entity_id`, `action`, `reason`, `changes` (JSONB), `actor_id`, `route_path`, `ip_address`, `user_agent`, `created_at`.
  - Filtro-chave para a timeline: `parent_patient_id`.
- **`patient_document_logs`**
  - Campos principais: `id`, `tenant_id`, `patient_id`, `document_id`, `user_id`, `action`, `happened_at`, `document_category`, `document_domain`, `document_origin`, `document_status`, `document_version`, `details` (JSONB).
  - Relação direta com paciente via `patient_id` (além do join por `document_id`).
- **Outras fontes**
  - `shift_timeline_events`, `financial_ledger_entries`, `inventory_movements` podem virar fontes complementares na fase por módulo.

### 2.2 Definir o modelo alvo lógico
```ts
type PatientHistoryEvent = {
  id: string;
  occurredAt: string; // ISO
  patientId: string;
  module: 'Paciente' | 'Administrativo' | 'Financeiro' | 'Clínico' | 'Estoque' | 'GED' | 'Escala' | 'Sistema';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'PRINT' | 'LOGIN' | 'LOGOUT' | 'DOC_UPLOAD' | 'DOC_ARCHIVE' | string;
  source?: {
    entityTable?: string;
    entityId?: string;
    routePath?: string;
    originTab?: string;
  };
  actor?: {
    userId?: string;
    name?: string;
    role?: string;
  };
  summary: string;
  details?: Record<string, any>;
};
```
- Apenas a definição de contrato; nada de ALTER TABLE.

### 2.3 Mapear como o modelo nasce das tabelas atuais
- **A partir de `system_audit_logs`:**
  - `occurredAt ← created_at`
  - `patientId ← parent_patient_id`
  - `module ← combinação entity_table + route_path` (ex.: `patients` → Paciente, `patient_admin_info` → Administrativo).
  - `action ← action`
  - `source.entityTable ← entity_table`
  - `source.entityId ← entity_id`
  - `source.routePath ← route_path`
  - `actor.userId ← actor_id` (nome/role via join em `user_profiles`, se disponível).
  - `summary/details ← reason + changes`.
- **A partir de `patient_document_logs`:**
  - `occurredAt ← happened_at`
  - `patientId ← patient_id`
  - `module = 'GED'`
  - `action ← action` (ex.: `document.create`, `document.update`, `document.view`).
  - `source.entityTable = 'patient_documents'` e `source.entityId ← document_id`.
  - `details ← details (JSONB)` com versões/status.

## 3. Fase B – API de Histórico do Paciente

### 3.1 Endpoint
- `GET /api/patients/[patientId]/history`
- Query params opcionais:
  - `from=2025-01-01&to=2025-12-31`
  - `modules=GED,Financeiro`
  - `actions=CREATE,UPDATE,DELETE`
- Regras gerais:
  - Ler `patientId` da rota.
  - Respeitar RLS/permissions existentes.

### 3.2 Implementação (próximo passo de código)
- Criar `src/app/api/patients/[patientId]/history/route.ts`.
- Passo a passo:
  1. Buscar eventos em `system_audit_logs` filtrando `parent_patient_id = :patientId` (fallback `entity_id = :patientId`).
  2. Buscar eventos em `patient_document_logs` filtrando `patient_id = :patientId`.
  3. Converter tudo para `PatientHistoryEvent`.
  4. Unificar arrays, ordenar por `occurredAt DESC` e aplicar filtros de módulo/ação/período.
  5. Retornar:
```json
{
  "events": [ /* PatientHistoryEvent */ ],
  "total": 123
}
```
- Nenhuma nova migration; operação somente leitura.

## 4. Fase C – UI da aba Histórico/Auditoria

### 4.1 Reescrever a aba
- Reaproveitar/renomear o componente (ex.: `TabHistory.tsx`).
- Usar SWR/React Query para consumir o endpoint da fase B.
- Exibir timeline vertical com:
  - Ícone/cor por módulo.
  - Texto curto (action + summary).
  - Badges para módulo e ação.
  - Drawer/modal para detalhes (diff/JSON) quando necessário.
- Filtros visíveis:
  - Período (Hoje, 7 dias, 30 dias, customizado).
  - Módulo.
  - Tipo de ação.

### 4.2 Estados de UI
- Loading: skeletons.
- Empty state: mensagem amigável + botão "Limpar filtros".
- Erro: alerta com ação de retry.
- Paginação ou infinite scroll (definir após protótipo).

## 5. Fase D – Integração por aba (logs de ações reais)

### 5.1 Serviço único de logging
- Criar `src/lib/audit/logAuditEvent.ts` encapsulando inserts em `system_audit_logs`.
- Parâmetros sugeridos: `tenantId`, `actorId`, `parentPatientId`, `entityTable`, `entityId`, `module`, `action`, `changes`, `reason`, `routePath`, `ipAddress`, `userAgent`.
- Reutilizar em todas as actions e rotas.

### 5.2 Rodada módulo a módulo
- **Dados pessoais** (`patients`, `patient_civil_documents`): logar criação/atualização com `module = 'Paciente'`.
- **Endereço/Logística** (`patient_addresses`, `patient_domiciles`): logar novos endereços, atualizações e vinculação de cuidador.
- **Rede de apoio** (`patient_related_persons`, `patient_household_members`): logar inclusão/edição de responsáveis e cuidadores.
- **Administrativo** (`patient_admin_info`, `patient_administrative_profiles`): registrar mudanças de status, convênios, responsáveis legais; eventos críticos também em `system_audit_logs`.
- **Financeiro** (`patient_financial_profiles`, `financial_records`, `financial_ledger_entries`): criar eventos para perfil financeiro e lançamentos.
- **Estoque / Inventário** (`patient_inventory`, `inventory_movements`, `patient_assigned_assets`, `patient_consumables_stock`): entradas/saídas, alocação/devolução de ativos.
- **Documentos (GED)**: manter `patient_document_logs`; adicionar eventos globais em `system_audit_logs` (upload, nova versão, arquivamento) com `module = 'GED'`.
- **Clínico**: hoje só leitura; no futuro, logar evoluções, prescrições, escalas de risco etc.

## 6. Fase E – Evoluções de banco (opcional, somente depois)
- Revisar se `system_audit_logs` precisa de novos campos ou índices.
- Avaliar se `patient_document_logs` deve armazenar `ip_address` e `user_agent` ou se isso fica apenas em `system_audit_logs`.
- Caso precise:
  1. Desenhar migrations pontuais.
  2. Validar com o assistente de banco.
  3. Ajustar ações/serviços para preencher os novos campos.

## 7. Fase F – Testes e documentação
- Criar `docs/TESTING_AUDIT_HISTORY.md` (e `docs/TESTING_GED.md` se necessário) com os cenários:
  1. Criar/editar paciente.
  2. Alterar endereço/logística.
  3. Incluir/editar rede de apoio.
  4. Alterar informações administrativas.
  5. Criar/alterar registro financeiro.
  6. Incluir documento, nova versão, arquivar.
  7. Validar timeline na aba Histórico.
- Executar testes manuais (Postman/Insomnia + UI) até termos automação.
- Atualizar `docs/GED_CHECKLIST.md` e este plano conforme itens forem concluídos.
