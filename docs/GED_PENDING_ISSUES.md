# GED Pending Issues

Each section below can be copied into an issue tracker entry. Pendências atuais focam em UI, integrações, auditoria, testes e desativação da camada legada `/api/ged/*`.

---

## 1. UI do Drawer — Header e ações
- **Status:** ✅ concluído (29/11/2025)
- **Resumo:** `GedPanel` recebeu header contextual (nome/status/ID), cartões de contagem (ativos/arquivados/vencidos/pendentes), ações inline (visualizar, download, nova versão, editar, arquivar) e ajustes de responsividade.
- **Escopo:**
  - Atualizações em `GedPanel` + `ged-panel-provider` entregues na sprint atual.
  - Badges/indicadores adicionais serão tratados como evoluções separadas, se necessário.
- **Aceite:** Usuário consegue identificar paciente e status no topo, ver o total de documentos filtrados e executar as ações sem sair do drawer (critério atendido).

## 2. Integrações — Abas com filtros e vínculo direto
- **Status:** ➖ em andamento
- **Resumo:** Abas Administrativo e Financeiro já chamam o `openGedPanel` com `filters.domain` adequado; falta aplicar o mesmo padrão na aba Clínico e, em seguida, evoluir para vínculos diretos (`finance_entry_id`, `clinical_visit_id`, etc.).
- **Escopo:**
  - Implementar o atalho contextual na aba Clínico (domínio Clínico).
  - Desenhar UI/fluxo para vincular/desvincular registros relacionados diretamente no drawer quando o prontuário liberar os identificadores.
  - Persistir o vínculo usando os campos já existentes (`finance_entry_id`, `clinical_visit_id`, `related_object_id`, ...).
- **Aceite:** Clínico passa a abrir o GED já filtrado; após a evolução das abas, o usuário consegue associar/desassociar registros sem “sair” do módulo.

## 3. Auditoria — IP e User-Agent
- **Status:** ➖ em andamento
- **Resumo:** Ampliar `patient_document_logs`/`ged/actions` para registrar IP e User-Agent (quando disponíveis via headers, Edge runtime ou Supabase context) para requisitos de compliance.
- **Escopo:**
  - Adicionar colunas `request_ip`, `user_agent` em `patient_document_logs` (nova migration).
  - Capturar metadados nas server actions e APIs REST.
  - Atualizar relatórios/exports se necessário.
- **Aceite:** Cada evento de documento possui IP/UA quando o request passou pela camada HTTP; fallback seguro para actions internas.

## 4. Testes — `TESTING_GED.md`
- **Status:** ⚠️ pendente
- **Resumo:** Criar roteiro de testes (manual inicialmente) cobrindo upload, filtros, versionamento, RLS, logs, atalhos das abas, REST API e assinatura digital.
- **Escopo:**
  - Documento `docs/TESTING_GED.md` com cenários, passos, dados de teste e resultados esperados.
  - Incluir checklist para cada camada (DB, RLS, storage, API, UI, auditoria).
  - Opcional: scripts para dados seed facilitando validação.
- **Aceite:** Documento revisado descrevendo ao menos um caso feliz e um caso de erro por fluxo crítico, pronto para futura automação.

## 5. Compat Layer `/api/ged/*`
- **Status:** ➖ em andamento
- **Resumo:** Migrar as rotas remanescentes (`/api/ged/preview`, `/api/ged/archive`, etc.) para a nova camada REST, documentar contratos e remover dependências do legado.
- **Escopo:**
  - Portar preview/download para `/api/patients/[patientId]/documents/...` reaproveitando o serviço compartilhado.
  - Reexpôr endpoints de arquivamento/restauração na mesma família REST.
  - Atualizar o front para abandonar chamadas diretas ao namespace antigo.
- **Aceite:** Nenhum componente consome mais `/api/ged/*` e os contratos REST estão documentados (README + checklist).
