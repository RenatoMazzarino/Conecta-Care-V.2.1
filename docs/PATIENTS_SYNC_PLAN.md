# PATIENTS_SYNC_PLAN

## Contexto e Objetivo
- Garantir que o modelo de dados do paciente esteja sincronizado entre código (UI, schemas Zod, server actions), Supabase (DDL + estado), e documentação de negócio.
- O snapshot do banco **não é** a verdade única. As regras de negócio descritas nas abas (patient tabs, GED, prontuário, auditoria) são a referência e orientam todas as decisões.
- Cada ciclo de auditoria deve resultar em docs atualizados, diffs planejados (DDL, código) e decisões claras por campo: manter/normalizar, remover do front ou criar/ajustar no banco.

## Ordem de Auditoria das Abas
| Ordem | Aba / Área | Escopo principal | Status |
| --- | --- | --- | --- |
| 1 | TabPersonal | Identidade, contatos, consentimentos, documentos civis | 🔜
| 2 | TabAddress | Endereço, logística de acesso, dados de deslocamento | 🔜
| 3 | TabSupportNetwork | Rede de apoio, contatos associados, responsáveis | 🔜
| 4 | TabAdministrative | Dados contratuais/assistenciais administrados | 🔜
| 5 | TabFinancial | Perfis financeiros, espelho do módulo financeiro | 🔜
| 6 | GED | Itens documentais + integrações GED | 🔜
| 7 | TabClinical | Dashboard clínico, prontuário futuro | 🔜
| 8 | TabInventory | Equipamentos e insumos associados | 🔜
| 9 | TabHistory | Histórico, timeline, auditoria | 🔜
| 10 | Visão Geral & Header | Cabeçalho paciente, resumos cruzados | 🔜

_Status legend:_ 🔜 pendente, 🟡 em andamento, ✅ concluído.

## Metodologia Padrão por Aba
1. **Inventário do Front**
   - Mapear campos presentes na UI (componentes em `src/modules/patients/components/**`), Zod schemas em `src/data/definitions/**`, DTOs e server actions (`src/modules/patients/actions.*`).
   - Identificar derivadas vs. campos persistidos.
2. **Comparação com o Banco**
   - Consultar snapshots (`db/snapshots/*.sql|json`) e DDLs (`db/ddl/**`).
   - Validar chaves estrangeiras relacionadas (endereços, administrativos, etc.).
3. **Decisão Campo a Campo**
   - Classificar cada campo em: manter/normalizar, remover do front, criar/ajustar no banco, mover para outra entidade.
   - Registrar decisão preliminar nas tabelas de cada aba **e** refletir em `docs/PATIENTS_CONTRACT.md` quando afetar `public.patients`.
4. **Ajustes de Código**
   - Atualizar schemas Zod (`src/data/definitions`), DTOs (`src/modules/patients/patient.data.ts`), server actions (`actions.upsert*.ts`) e APIs (`src/app/api/patients/**`).
   - Garantir que payloads enviados ao Supabase correspondam exatamente às colunas existentes, evitando campos órfãos.
5. **DDL / Migrações**
   - Quando necessário criar/alterar colunas, gerar scripts idempotentes em `db/ddl/**`. Nunca aplicar diretamente: encaminhar para execução via assistente de banco.
6. **Integração com Auditoria**
   - Rever planos em `docs/AUDIT_PATIENT_HISTORY_PLAN.md` e aproveitar `src/lib/audit/**` + `/api/patients/[patientId]/history` para registrar eventos por aba.
7. **Testes & Verificação**
   - Executar smoke tests da aba (UI e server actions) usando dados seed quando possível.
   - Registrar pendências impactando GED em `docs/GED_CHECKLIST.md` e `docs/GED_PENDING_ISSUES.md`.

## Artefatos que Devem Ser Mantidos em Sincronia
- `docs/PATIENTS_SYNC_PLAN.md`: status macro por aba e metodologia.
- `docs/PATIENTS_CONTRACT.md`: contrato detalhado `public.patients` (verdade operacional para colunas-core).
- Documentos específicos por aba (quando necessário) descrevendo decisões e pendências.
- Scripts DDL e snapshots para qualquer alteração pactuada.

## Próximas Ações Imediatas
1. Finalizar inventário completo da tabela `public.patients` (documentado em `docs/PATIENTS_CONTRACT.md`).
2. Iniciar auditoria da **TabPersonal** seguindo a metodologia acima.
3. Registrar requisitos de auditoria derivados no plano (`Status` da tabela acima) para acompanhamento.
