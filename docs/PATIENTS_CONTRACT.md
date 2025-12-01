# PATIENTS_CONTRACT

Contrato operacional da tabela `public.patients`, consolidando snapshot `db/snapshots/conectacare-2025-11-29.sql` e o uso real no código (`src/modules/patients/**`, `src/data/definitions/**`, `src/app/(app)/patients/**`, APIs em `src/app/api/patients/**`, actions de suporte em `src/modules/schedule/**` e seeds em `scripts/`).

## Fontes analisadas
- Snapshot SQL completo (`db/snapshots/conectacare-2025-11-29.sql`) e metadata JSON correlata.
- Componentes e formulários: `src/modules/patients/components/tabs/TabPersonal.tsx`, `PatientTabsLayout`, cabeçalhos (`src/components/patients/v2/patient-header.tsx`).
- Schemas/DTOs: `src/data/definitions/personal.ts`, `patient.ts`, `src/modules/patients/patient.data.ts`.
- Server actions/API: `src/modules/patients/actions*.ts`, `src/app/(app)/patients/actions.quick-create.ts`, `src/app/(app)/patients/[patientId]/actions.*`, `src/app/api/patients/**` (history, clinical dashboard, documentos).
- Outros consumidores diretos (`primary_contractor_id` em `src/modules/schedule/actions*.ts`, importers em `src/modules/patients/actions.bulk-import.ts`).

## Destaques imediatos
- O código cria/atualiza um campo **`status`** em várias ações (`createPatientAction`, `quickCreatePatientAction`, `actions.getHeader.ts`), mas a tabela só possui `record_status`. Precisamos alinhar imediatamente para evitar falhas silenciosas.
- `doc_validation_status` tem `CHECK` que permite apenas `{'Nao Validado','Validado','Inconsistente','Em Analise'}`, porém o **DEFAULT é `'Pendente'`** (fora do conjunto) e a UI usa também `Rejeitado`/`Nao_Validado`. Há risco de violação de constraint ao salvar.
- `pref_contact_method` aceita apenas `whatsapp|phone|email`, enquanto `PatientPersonalSchema`/UI permitem `sms` e `other`.
- Duplicidade conceitual entre `document_validation_method` e `doc_validation_method`. O front usa o primeiro, mas ambos estão expostos no DTO; precisamos decidir qual sobreviverá.
- Campos aparentemente legados e não usados: `communication_preferences`, `external_ids`, `mobile_phone_verified`, `secondary_phone_type`, `email_verified`, `place_of_birth` (sem sufixo). Avaliar remoção ou reincorporação.
- `created_at`/`updated_at` são `DEFAULT now()` mas não há trigger para atualizar `updated_at`. Boa prática adicionar trigger ou atualizar manualmente nas server actions.

## Campos referenciados no código, mas ausentes no schema atual
| Campo esperado | Onde aparece | Impacto | Próximo passo |
| --- | --- | --- | --- |
| `patients.status` | `src/modules/patients/actions.ts#createPatientAction`, `actions.quick-create.ts`, `actions.getHeader.ts`, `patient-header.tsx` | Inserts e selects falham silenciosamente (coluna inexistente), deixando `record_status` desatualizado (ou sem dados). | Atualizar código para usar apenas `record_status` **ou** adicionar coluna `status` se negócio exigir (preferência: normalizar para `record_status`). |

## Contrato detalhado da tabela `public.patients`

### Chaves, tenancy e relacionamento
| Coluna | Tipo / Default | Constraints | Uso no código atual | Decisão preliminar | Notas |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` `DEFAULT gen_random_uuid()` | `PRIMARY KEY` | Consumido em todos os DTOs e joins; usado como FK por >20 tabelas. | **Manter** | Base da identidade do paciente. |
| `tenant_id` | `uuid` `DEFAULT app_private.current_tenant_id()` | RLS implícito | Lido em `actions.upsertPersonal` para propagar a `patient_civil_documents`. | **Manter** (validar carregamento automático no supabase client) | Garantir que RLS sempre aplica. |
| `primary_contractor_id` | `uuid` | `REFERENCES public.contractors(id)` | Filtros em `getPatientsPaginated`, escalas (`src/modules/schedule/actions*.ts`), importers e seeds. | **Manter/normalizar** | Necessário selecionar/joinar no contrato para mostrar contratante. |
| `created_at` | `timestamptz` `DEFAULT now()` | — | Usado em `getPatients` para ordenar e em timelines (overview). | **Manter** (avaliar trigger para update) | Considerar `last_activity` derivado. |
| `updated_at` | `timestamptz` `DEFAULT now()` | — | Não atualizado nas server actions atuais. | **Ajustar** | Criar trigger ou atualizar manualmente para refletir alterações. |

### Identidade e demografia
| Coluna | Tipo / Default | Constraints | Uso no código atual | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `full_name` | `text` `NOT NULL` | — | Formulários (`CreatePatientSchema`, `PatientPersonalSchema`), grid, header. | **Manter** | Padronizar capitalização. |
| `social_name` | `text` | — | TabPersonal (`defaultValues` e exibição). | **Manter** | Expor no header. |
| `nickname` | `text` | — | TabPersonal input. | **Manter** | Pode alimentar cards rápidos. |
| `salutation` | `text` | — | TabPersonal. | **Manter** | Sem validação; considerar enum. |
| `pronouns` | `text` | `CHECK pronouns ∈ {'Ele/Dele','Ela/Dela','Elu/Delu','Outro'}` | TabPersonal + schema. | **Manter** (validar enum) | UI segue mesmo conjunto. |
| `gender` | `text` | — | `CreatePatientSchema` usa enum `['M','F','Other']`; TabPersonal converte entre `M/F/Other` e labels PT. | **Ajustar** | Definir enum único (ideal: armazenar `M/F/O` + campo `gender_display`). |
| `gender_identity` | `text` | `CHECK ... ('Cisgenero','Transgenero','Nao Binario','Outro','Prefiro nao informar')` | TabPersonal + schema. | **Manter** | No front já segue. |
| `date_of_birth` | `date` | — | Todos os fluxos (idade, filtros). | **Manter** | Converter via UTC. |
| `mother_name` | `text` | — | TabPersonal. | **Manter** | — |
| `father_name` | `text` | — | TabPersonal (via guardian view). | **Manter** | Campo disponível na UI. |
| `civil_status` | `text` | — | Única coluna utilizada para estado civil em todo o front. | **Manter** | `marital_status` removido tanto no app quanto no plano de DDL. |
| `nationality` | `text` `DEFAULT 'Brasileira'` | — | TabPersonal (default). | **Manter** | Corrigir default com aspas simples normais no DDL. |
| `preferred_language` | `text` `DEFAULT 'Português'` | — | TabPersonal. | **Manter** | Avaliar enum. |
| `place_of_birth` | `text` | — | **Não referenciado** nos componentes atuais. | **Remover do front / avaliar legado** | Talvez substituir pelos campos normalizados abaixo. |
| `place_of_birth_city` | `text` | — | TabPersonal & DTOs. | **Manter** | — |
| `place_of_birth_state` | `text` | — | TabPersonal. | **Manter** | Validar UF (2 chars). |
| `place_of_birth_country` | `text` `DEFAULT 'Brasil'` | — | TabPersonal. | **Manter** | — |
| `race_color` | `text` | `CHECK lista fixa` | TabPersonal + `PatientPersonalSchema`. | **Manter** | UI usa valores com acento (verificar). |
| `education_level` | `text` | `CHECK lista` | TabPersonal. | **Manter** | Enum bate com schema. |
| `profession` | `text` | — | TabPersonal + grid. | **Manter** | — |
| `is_pcd` | `boolean` `DEFAULT false` | — | TabPersonal (switch). | **Manter** | — |

### Documentos e identificação oficial
| Coluna | Tipo / Default | Constraints | Uso no código | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `cpf` | `text` | `UNIQUE (cpf, tenant_id)` + regex `^[0-9]{11}$` | Validado em `CreatePatientSchema`, `quickCreate`, filtros. | **Manter** | UI envia com máscara → remover antes de salvar. |
| `cpf_status` | `text` `DEFAULT 'valid'` | `CHECK ∈ {'valid','invalid','unknown'}` | TabPersonal exibe e aceita qualquer string. | **Ajustar** | UI precisa restringir ao enum ou criar tabela de status com label. |
| `cns` | `text` | — | TabPersonal. | **Manter** | Verificar validação. |
| `rg` | `text` | — | TabPersonal. | **Manter** | — |
| `rg_issuer` | `text` | — | TabPersonal. | **Manter** | — |
| `rg_issuer_state` | `text` | `CHECK ~ '^[A-Z]{2}$'` | TabPersonal (2 chars). | **Manter** | UI já limita. |
| `rg_issued_at` | `date` | — | TabPersonal. | **Manter** | Convert to ISO. |
| `national_id` | `text` | — | TabPersonal. | **Manter** | Documentos estrangeiros. |
| `document_validation_method` | `text` | — | TabPersonal fallback `manual`; `PatientPersonalSchema`. | **Manter** (renomear p/ `doc_validation_method`?) | Decidir qual coluna ficará ativa. |
| `doc_validation_method` | `text` | — | Apenas trafega via `FullPatientDetails` (nunca editado). | **Avaliar remoção ou merge** | Duplicidade com `document_validation_method`. |
| `doc_validation_status` | `text` `DEFAULT 'Pendente'` | `CHECK ∈ {'Nao Validado','Validado','Inconsistente','Em Analise'}` | UI aceita `Pendente`, `Rejeitado`, `Nao_Validado`, etc. | **Ajustar** | Harmonizar enum + default; adicionar tradução front/back. |
| `doc_validated_at` | `timestamptz` | — | TabPersonal exibe; não atualizado automaticamente. | **Manter** | Preencher nas ações de validação. |
| `doc_validated_by` | `uuid` | `REFERENCES auth.users(id)` | Nunca preenchido no front atual. | **Criar trilha** | Integrar com auditoria/validador. |
| `doc_validation_source` | `text` | — | TabPersonal (read-only). | **Manter** | Alimentar em pipelines externos. |
| `document_validation_method` vs `doc_validation_method` | — | — | — | — | Destacar unificação na fase TabPersonal. |

### Contatos e comunicação
| Coluna | Tipo / Default | Constraints | Uso | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `mobile_phone` | `text` | — | Todos os formulários e quick-create. | **Manter** | — |
| `mobile_phone_verified` | `boolean` `DEFAULT false` | — | **Não usado**. | **Avaliar** (remover ou automatizar verificação) | Poderia ser preenchido por serviço de verificação. |
| `secondary_phone` | `text` | — | TabPersonal. | **Manter** | — |
| `secondary_phone_type` | `text` | — | **Sem uso**. | **Remover ou adicionar UI** | Decidir se diferencia fixo/celular. |
| `email` | `text` | — | Formulários e quick-create. | **Manter** | Validar formato (já existe). |
| `email_verified` | `boolean` `DEFAULT false` | — | Não utilizado. | **Avaliar** (pode sincronizar com provedores) | — |
| `pref_contact_method` | `text` | `CHECK ∈ {'whatsapp','phone','email'}` | UI/Schema aceitam `sms` e `other`. | **Ajustar** | Expandir `CHECK` ou reduzir UI. |
| `contact_time_preference` | `text` | `CHECK lista ('Manha','Tarde','Noite','Comercial','Qualquer Horario')` | TabPersonal. | **Manter** | UI em PT corresponde. |
| `contact_notes` | `text` | — | TabPersonal. | **Manter** | Limite 255 via schema. |
| `communication_preferences` | `jsonb` `DEFAULT {sms,email,whatsapp}` | — | **Nunca lido** (flags individuais `accept_*` substituem). | **Remover / migrar** | Evitar duplicidade com colunas booleanas. |
| `external_ids` | `jsonb` | — | Não utilizado atualmente. | **Ajustar** (reservar para integrações) | Definir contrato (ex: `[{source:'erp',value:'123'}]`). |

### Consentimento, marketing e privacidade
| Coluna | Tipo / Default | Constraints | Uso | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `photo_consent` | `boolean` `DEFAULT false` | — | TabPersonal toggle. | **Manter** | — |
| `photo_consent_date` | `timestamptz` | — | Lido/exibido, não preenchido automaticamente. | **Ajustar** | Auto preencher quando `photo_consent` true. |
| `accept_sms` | `boolean` `DEFAULT true` | — | TabPersonal + auditoria consentimento. | **Manter** | — |
| `accept_email` | `boolean` `DEFAULT true` | — | Idem. | **Manter** | — |
| `block_marketing` | `boolean` `DEFAULT false` | — | TabPersonal. | **Manter** | — |
| `marketing_consented_at` | `timestamptz` | — | Atualizado manualmente em `actions.upsertPersonal` quando flags mudam. | **Manter** | Garantir timezone. |
| `marketing_consent_source` | `text` | `CHECK lista (Portal, Formulario, etc)` | Atribuído manualmente; UI permite texto livre. | **Ajustar** | Validar combo para evitar violar CHECK. |
| `marketing_consent_ip` | `inet` | — | UI trata como string. | **Manter** | Converter para formato válido (ex: `192.168.0.1`). |
| `marketing_consent_status` | `text` `DEFAULT 'pending'` | `CHECK {'pending','accepted','rejected'}` | UI trabalha com mesmo conjunto. | **Manter** | — |
| `marketing_consent_history` | `text` | — | Registro textual concatenado em `actions.upsertPersonal`. | **Manter (avaliar jsonb)** | Poderia virar JSON estruturado. |

### Estado do registro e onboarding
| Coluna | Tipo / Default | Constraints | Uso | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `record_status` | `text` `DEFAULT 'active'` | `CHECK {'draft','onboarding','active','inactive','deceased','discharged','pending_financial'}` | Filtros, header, finalize-admission. | **Manter** | Padronizar uso (eliminar `status`). |
| `onboarding_step` | `integer` `DEFAULT 1` | — | `quickCreate`/`finalize-admission` controlam; UI usa para fluxo. | **Manter** | Documentar etapas (1-4). |

### Contatos eletrônicos adicionais
| Coluna | Tipo / Default | Constraints | Uso | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `pref_contact_method` | (já listado acima) | | | | |
| `communication_preferences` | (listado) | | | | |

### Demais colunas diversas
| Coluna | Tipo / Default | Constraints | Uso | Decisão | Notas |
| --- | --- | --- | --- | --- | --- |
| `national_id` | `text` | — | TabPersonal. | **Manter** | Documentos nativos/estrangeiros. |
| `place_of_birth` | `text` | — | Não usado. | **Rever** | Pode ser removido após confirmar legado. |
| `has_legal_guardian` | `boolean` `DEFAULT false` | — | TabPersonal (seção "Responsável Legal") via view `view_patient_legal_guardian_summary`. | **Manter** | Preencher automaticamente quando existir guardião. |
| `legal_guardian_status` | `text` `DEFAULT 'Nao possui'` | `CHECK {'Nao possui','Cadastro Pendente','Cadastro OK'}` | TabPersonal (exibição). | **Manter** | Integrar com fluxo da rede de apoio. |
| `salutation` | (já listado) | | | | |
| `marketing_consent_history` | (listado). | | | | |

### Campos de contato duplicados / potencial legado
| Coluna | Tipo / Default | Observação | Proposta |
| --- | --- | --- | --- |
| `communication_preferences` | `jsonb` | Front usa apenas `accept_sms/email` e `block_marketing`. | Converter em view derivada ou remover. |
| `external_ids` | `jsonb` | Nenhum consumidor atual; útil para integrações. | Formalizar estrutura JSON e carregar em UI quando integrações forem ativadas. |
| `mobile_phone_verified` / `email_verified` | `boolean` | Nunca atualizados. | Preencher a partir de serviços externos ou remover. |
| `secondary_phone_type` | `text` | Sem uso. | Implementar drop-down se for útil ou remover. |

### Constraints globais
- `PRIMARY KEY (id)` e `UNIQUE (cpf, tenant_id)` garantem unicidade multi-tenant.
- `FOREIGN KEY doc_validated_by → auth.users(id)` nunca é populada; avaliar risco de FK com deletes.
- `CHECK` `pref_contact_method`, `doc_validation_status`, `marketing_consent_status`, `legal_guardian_status`, `education_level`, `pronouns`, etc. precisam estar sincronizados com enums utilizados nas Zod schemas.

## Próximos passos sugeridos
1. **Corrigir imediatamente** as ações que usam `patients.status`, alterando para `record_status` (e rodar linters/tests das server actions afetadas).
2. **Alinhar enums** (`doc_validation_status`, `pref_contact_method`, `gender`) entre banco e `PatientPersonalSchema`. Avaliar migração para enums PostgreSQL nativos.
3. **Decidir sobre colunas duplicadas/legadas** (`document_validation_method` vs `doc_validation_method`, `communication_preferences`, `place_of_birth`, campos *_verified). Incluir decisão final quando auditarmos TabPersonal.
4. **Definir estratégia para `updated_at`** (trigger ou atualização manual) antes das próximas migrações.
5. **Documentar formato esperado de `external_ids`** para futuras integrações, mesmo que hoje não haja consumo.
