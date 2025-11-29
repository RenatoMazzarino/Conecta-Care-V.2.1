# Plano da Auditoria e Histórico do Paciente

## 0. Premissas e objetivos imediatos
- GED: fluxo completo (schema, RLS, REST e drawer) já estabilizado; nenhum ajuste estrutural pendente.
- Clínico: aba convertida para painel somente leitura consumindo `GET /api/patients/[patientId]/clinical-dashboard`.
- Auditoria: próxima frente prioriza desenho do modelo de eventos e reconstrução da aba Histórico/Auditoria antes de qualquer nova migration.
- Constrangimento: nenhuma alteração de schema deve ser aplicada sem alinhamento prévio; toda análise deve olhar para o snapshot oficial.

## 1. Fonte canônica do schema
- **Snapshots vigentes**:
  - `db/snapshots/conectacare-2025-11-29.sql`
  - `db/snapshots/conectacare-2025-11-29.json`
- Ambos representam o dump completo mais recente do Supabase e devem ser considerados **fonte única de verdade** para colunas, tipos, RLS e dados auxiliares enquanto evoluímos auditoria/histórico.
- Uso: consultar (não importar) esses arquivos para validar qualquer suposição sobre o schema real; escolher o formato mais conveniente (SQL ou JSON) por consulta.
- Escopo: exclusivamente referência/documentação. Não gerar migrations automáticas nem tentar sincronizar o schema a partir deles sem alinhamento explícito.

## 2. Camada A — Modelo de Auditoria Global

### 2.1 Inventário inicial de tabelas de log (estado atual)
| Tabela | Papel atual | Colunas relevantes observadas |
| --- | --- | --- |
| `system_audit_logs` | Tabela "mestra" que já concentra eventos de pacientes e de outros módulos (alimentada por triggers e ações manuais). | `id`, `tenant_id`, `parent_patient_id`, `entity_table`, `entity_id`, `action`, `reason`, `changes` (JSONB), `actor_id`, `route_path`, `ip_address`, `user_agent`, `created_at`. |
| `patient_document_logs` | Auditoria granular do GED (upload/versão/atualização/arquivamento) conforme `db/ddl/2025-11-29-patient-documents.sql`. | `id`, `tenant_id`, `patient_id`, `document_id`, `user_id`, `action`, `happened_at`, `document_category`, `document_domain`, `document_origin`, `document_status`, `document_version`, `details`. |
| Outros potenciais (consultar snapshot) | Há menções históricas a `patient_history` / `*_logs` em serviços antigos; confirmar no snapshot antes de considerar reutilização. | Usar `db/snapshots/conectacare-2025-11-29.sql` para validar existência real. |

### 2.2 Modelo alvo de evento de auditoria (por paciente)
Cada item consolidado deverá seguir o formato abaixo (representação JSON para referência):
```json
{
  "id": "uuid-or-bigint",
  "occurred_at": "2025-11-29T14:32:01Z",
  "tenant_id": "uuid",
  "patient_id": "uuid",
  "module": "clinico|financeiro|ged|paciente|...",
  "origin": {
    "tab": "Clínico",
    "route": "/patients/{id}/clinical"
  },
  "entity": {
    "table": "patient_clinical_profiles",
    "id": "uuid",
    "label": "Perfil clínico"
  },
  "action": "CREATE|UPDATE|VIEW|ARCHIVE|ASSIGN|...",
  "actor": {
    "id": "uuid|null",
    "name": "Profissional",
    "type": "user|service|system",
    "role": "Enfermeiro"
  },
  "details": {
    "diff": {"before": {}, "after": {}},
    "payload": {},
    "document_meta": {}
  },
  "raw_source": {
    "table": "system_audit_logs",
    "row_id": "..."
  }
}
```

### 2.3 Cobertura vs lacunas
- **Cobertura atual**
  - `system_audit_logs` já provê `tenant_id`, `patient_id` (via `parent_patient_id`), `entity_table`, `action`, `changes` e `actor_id`.
  - `patient_document_logs` já oferece `document_*` e `details` específicos do GED.
- **Lacunas mapeadas** (não atacar agora, apenas registrar)
  1. **Contexto de UI**: origem/tela ainda não padronizada (`route_path` cobre parcialmente).
  2. **Dados de request**: campos como IP/User-Agent estão presentes apenas via insert manual e ainda não são obrigatórios.
  3. **Atores anônimos/sistemas**: falta padronização para jobs automáticos.
  4. **Taxonomia de módulos/ações**: enums ainda dispersos (cada módulo usa strings próprias).
  5. **Relacionamento com versões/documentos**: somente GED possui log dedicado.
- Essas lacunas serão endereçadas após a nova aba Histórico estar estável, com migrations discutidas junto ao assistente de banco.

## 3. Camada B — Aba Histórico/Auditoria do paciente

### 3.1 API `GET /api/patients/[patientId]/history`
1. **Fonte de dados**
   - `system_audit_logs`: buscar eventos por `parent_patient_id` (ou fallback `entity_id`).
   - `patient_document_logs`: buscar eventos por `patient_id`.
2. **Normalização**
   - Mapear ambas as tabelas para o modelo alvo descrito em 2.2.
   - Harmonizar campos (`happened_at` → `occurred_at`, `document_domain` → `module`, etc.).
   - Enriquecer ator com `user_profiles` quando disponível (sem bloquear a resposta se o join falhar).
   - Ordenar os eventos em ordem decrescente de data e paginar (parâmetros `cursor`/`limit`).
3. **Filtros e query params iniciais**
   - `module` (multi-select), `action`, `date_from`, `date_to`, `has_changes` (boolean).
   - Nenhuma dependência de novos campos; trabalhar apenas com colunas já existentes nos logs.
4. **Contrato de resposta (esboço)**
```json
{
  "data": [ { "id": "...", "occurred_at": "...", "module": "...", "action": "...", "actor": {"id": "...", "name": "..."}, "summary": "...", "details": {...} } ],
  "meta": { "total": 120, "nextCursor": "..." }
}
```

### 3.2 UI da aba Histórico/Auditoria
- Transformar a aba atual em uma **timeline cronológica** consumindo a nova API.
- Componentes principais:
  1. **Header com filtros**: multi-select de módulo, ação e intervalo de datas; botão para limpar filtros.
  2. **Timeline**: cada evento exibe ícone por módulo, descrição curta ("Atualizou endereço"), metadados (quem, quando) e link para detalhes em um drawer (exibir diff/JSON).
  3. **Badges**: tipo de ação (CREATE/UPDATE/VIEW) e origem (ex.: GED, Clínico).
  4. **Empty states**: instruir usuário a ajustar filtros se não houver eventos.
  5. **Loading/pagination**: suportar infinite scroll ou paginação tradicional.
- Primeira versão deve se limitar às informações já disponíveis nos logs atuais.

## 4. Fase posterior — auditoria por aba
Após validar a API/UI de histórico:
1. Revisar cada aba funcional (Dados pessoais, Endereço/Logística, Rede de apoio, Administrativo, Financeira, Documentos, Clínico).
2. Para cada ação relevante (criação, atualização, anexos, atribuições), definir o evento esperado e integrá-lo a um **serviço único de logging** (provavelmente wrapping `system_audit_logs`).
3. Introduzir gradualmente novos campos (IP, User-Agent, origem exata da tela, etc.) via migrations coordenadas com o assistente de banco.
4. Atualizar documentação do modelo global sempre que um novo tipo de evento for suportado.

## 5. Próximos passos práticos
1. Sempre referenciar `db/snapshots/conectacare-2025-11-29.sql` ou `db/snapshots/conectacare-2025-11-29.json` ao mapear tabelas/colunas reais (sem gerar migrations a partir deles).
2. Implementar `GET /api/patients/[patientId]/history` seguindo o desenho da seção 3.1.
3. Refatorar a aba Histórico/Auditoria para consumir a API (seção 3.2).
4. Só então abrir a fase de revisões por aba + novas migrations.
