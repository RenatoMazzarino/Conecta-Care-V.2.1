# GED Checklist — 29/11/2025

Status legend: ✅ atendido · ➖ em andamento/parcial · ⚠️ pendente.

## Núcleo GED confirmado
- ✅ `patient_documents` definido como fonte canônica, com campos de classificação, ciclo de vida, assinatura e metadados de armazenamento.
- ✅ Índices alinhados ao painel (categoria, domínio, status, paciente + filtros combinados, tags GIN, created_at) publicados em `db/ddl/2025-11-29-patient-documents.sql`.
- ✅ RLS ativa em `patient_documents`, com função `can_access_patient_document` que cruza visibilidade clínica/adm e equipe atual.
- ✅ Painel lateral global operacional via `GedPanelProvider` + `GedTriggerButton`, consumindo os endpoints REST atuais para detalhes/versões/logs.
- ✅ Tabela `patient_document_logs` e eventos de auditoria ligados às ações de upload/versão/atualização/arquivamento.

## Checklist operacional

### DB
- Status: ✅
- Cobertura: DDL versionada, constraints/FKs, índices principais, logs dedicados.
- Próximo passo: planejar refino de nomenclaturas (`document_status` vs `status`, `origin_module` vs `source_module`) para a próxima rodada de migrations sem alterar o schema atual.

### RLS (patient_documents)
- Status: ✅
- Cobertura: Políticas SELECT/INSERT/UPDATE alinhadas ao helper `can_access_patient_document`, com `current_care_team` garantindo que apenas vínculos ativos enxerguem documentos clínicos.
- Próximo passo: revisar se operações de DELETE passarão a ser via soft delete (`deleted_at`) antes de liberar política explícita.

### Storage (bucket `patient-documents` em `storage.objects`)
- Status: ✅
- Cobertura atual: Policy `patient_documents_files_select_authenticated` criada diretamente no Supabase (via owner) garantindo que `storage.objects` só libere SELECT para `authenticated` quando `file_path` estiver vinculado a um doc visível pelo usuário; policies genéricas (`storage_select_*`, `storage_insert_*`, `storage_delete_*`) removidas.
- Cobertura complementar: clientes acessam arquivos apenas via APIs que usam `service-role` (download/preview) ou via signed URLs emitidas por essas APIs; qualquer tentativa de leitura direta por usuários autenticados passa agora pela mesma lógica de RLS de `patient_documents`.
- Próximo passo: manter o script versionado em `db/ddl/storage/patient-documents-rls.sql` como fonte de verdade e estender para INSERT/DELETE se uploads diretos por clientes passarem a existir.

### API REST
- Status: ✅
- Cobertura atual: `GET /api/patients/{patientId}/documents` (list), `POST /api/patients/{patientId}/documents` (criação/metadados), `PATCH /api/patients/{patientId}/documents/{documentId}` (edição) e `POST /api/patients/{patientId}/documents/{documentId}/version` (nova versão), além dos detalhes/versões/logs existentes.
- Observação: `GedPanel.tsx` agora consome apenas essas rotas REST para listar, criar, atualizar e versionar documentos; `/api/ged/*` permanece apenas para preview/archive até ser migrado.

### UI do drawer
- Status: ✅
- Cobertura atual: Drawer global com header contextual (nome/status/ID curto), cartões de contagem (ativos, arquivados, vencidos, pendentes de assinatura), ações inline para visualizar/baixar/nova versão/editar/arquivar e responsividade ajustada para larguras de 768–1024 px usando o mesmo serviço compartilhado (`src/lib/ged/service.ts`, `logging.ts`, `utils.ts`).
- Próximo passo: acompanhar evoluções solicitadas (ex.: badges adicionais ou novos filtros) e alinhar quando `/api/ged/*` for substituído pela camada REST completa.

### Integrações / Atalhos
- Status: ➖
- Cobertura atual: Abas Administrativo e Financeiro expõem botões "Abrir GED ..." que invocam `openGedPanel` com `filters.domain` pré-preenchido (mantendo os filtros ajustáveis depois da abertura).
- Lacunas: Replicar o mesmo comportamento na aba Clínico e evoluir para presets adicionais (categoria/identificadores vinculados) quando o prontuário permitir vínculos diretos (`finance_entry_id`, `clinical_visit_id`, etc.).

### Auditoria
- Status: ➖
- Cobertura atual: Logs registram usuário, ação, domínio, status, versão e payloads.
- Lacunas: Adicionar IP e User-Agent onde disponível para fortalecer rastreabilidade e atender requisitos de compliance.

### Testes
- Status: ⚠️
- Lacuna: Falta roteiro/documento `TESTING_GED.md` descrevendo cenários manuais/automatizados (upload, filtros, versionamento, RLS, logs, atalhos UI, flows REST).

## Pendências agrupadas
1. **Integrações / Abas (➖)** — Falta apenas a aba Clínico abrir o GED filtrado pelo domínio clínico e, em seguida, habilitar presets/vínculos adicionais.
2. **Auditoria (➖)** — Enriquecer logs com IP e User-Agent quando disponíveis (HTTP headers ou contexto Supabase).
3. **Testes (⚠️)** — Criar `TESTING_GED.md` ou roteiro similar cobrindo cenários críticos e evidências (incluindo chamada das novas rotas REST via Postman/Insomnia).
4. **Compat Layer /api/ged/* (➖)** — Migrar endpoints restantes (preview, archive, etc.) para a camada REST, publicar contratos finais e desativar a API legada.

## RLS do Storage (bucket `patient-documents`)
- Script versionado em `db/ddl/storage/patient-documents-rls.sql`.
- Politica `patient_documents_files_select_authenticated` já aplicada no Supabase por role owner, após a remoção de policies públicas anteriores.
- Execução sempre manual via console SQL com permissão no schema `storage` (owner/superuser); ambientes de app continuam usando service-role para upload/remoção.
- Para políticas adicionais (INSERT/DELETE) ou ajustes, evoluir o mesmo arquivo para manter histórico centralizado.

## Plano de refino de nomenclaturas
- Mapear divergências (`document_status` vs `status`, `origin_module` vs `source_module`, `signature_type` vs `firma_tipo` em integrações legadas) durante a próxima rodada de migrations.
- Propor aliases temporários nas views ou camadas REST antes da troca definitiva para evitar breaking changes na UI.
- Documentar a matriz de campos no próximo pacote DDL antes de executar alterações no banco.
