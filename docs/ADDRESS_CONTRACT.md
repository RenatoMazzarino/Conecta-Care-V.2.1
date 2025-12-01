# ADDRESS_CONTRACT

Auditoria entre a aba **TabAddress** (prontuário web) e as tabelas **public.patient_addresses** / **public.patient_domiciles** capturadas no snapshot `db/snapshots/conectacare-2025-11-29.(sql|json)`.

Fontes correlacionadas:
- `db/snapshots/conectacare-2025-11-29.sql` e `.json` (estrutura real do Supabase)
- `src/modules/patients/components/tabs/TabAddress.tsx`
- `src/modules/patients/actions.upsertAddress.ts`
- `src/schemas/patient.address.ts` / `src/data/definitions/address.ts`
- `src/modules/patients/patient.data.ts` (carregamento de address/domicile)

## 1. Colunas de `public.patient_addresses`

| Coluna | Tipo / Default / CHECK | Status no app | Observações |
| --- | --- | --- | --- |
| `patient_id` | `uuid` PK | Preenchido implicitamente (patientId) | Única linha por paciente; action usa `onConflict: 'patient_id'`. |
| `street` | `text NOT NULL` | TabAddress lê/escreve (`addressLine`) | Campo obrigatório no formulário. |
| `number` | `text NOT NULL` | TabAddress lê/escreve (`number`) | Obrigatório. |
| `neighborhood` | `text NOT NULL` | TabAddress lê/escreve | Obrigatório. |
| `city` | `text NOT NULL` | TabAddress lê/escreve | Obrigatório. |
| `state` | `text NOT NULL CHECK state ~ '^[A-Z]{2}$'` | TabAddress lê/escreve (`state`) | Form/schema normalizam para uppercase e restringem às 27 UFs; o server action valida antes do upsert. |
| `zip_code` | `text` | TabAddress lê/escreve (`zipCode`) | Server valida `NNNNNNNN/NNNNN-NNN`, formata para `00000-000` e cruza CEP × UF via BrasilAPI antes de persistir. |
| `complement` | `text` | TabAddress lê/escreve | OK. |
| `reference_point` | `text` | TabAddress lê/escreve (`referencePoint`) | OK. |
| `zone_type` | `text CHECK ∈ {Urbana,Rural,Periurbana,Comunidade,Risco,Nao_informada}` | TabAddress lê/escreve (`zoneType`) | Valores batem (usa `Nao_informada`). |
| `facade_image_url` | `text` | Não usado no front | Sem campo na UI. |
| `allowed_visit_hours` | `text` | Não usado | Sem campo/UI. |
| `travel_notes` | `text` | TabAddress lê/escreve (`travelNotes` + `worksOrObstacles`) | Conteúdo principal do textarea "Informações para o motorista" + bloco "Obras/obstáculos" (quando informado). |
| `eta_minutes` | `integer` | Não usado | Nenhum componente seta/mostra. |
| `property_type` | `text CHECK ∈ {Casa,...,Nao_informado}` | TabAddress lê/escreve (`propertyType`) | OK. |
| `condo_name` | `text` | TabAddress lê/escreve | OK. |
| `block_tower` | `text` | TabAddress lê/escreve | OK. |
| `floor_number` | `integer` | TabAddress lê/escreve (`floorNumber`) | OK (usa `z.coerce.number()`). |
| `unit_number` | `text` | TabAddress lê/escreve | OK. |
| `elevator_status` | `text CHECK ∈ {Nao_tem,Tem_nao_comporta_maca,Tem_comporta_maca,Nao_informado}` | TabAddress lê/escreve (labels normalizados) | UI continua exibindo "Não tem"/"Tem - ...", mas o payload converte para os tokens aceitos. |
| `wheelchair_access` | `text CHECK ∈ {Livre,Com_restricao,Incompativel,Nao_avaliado}` | TabAddress usa labels com acento | Labels mapeados para `Livre`, `Com_restricao`, `Incompativel` e `Nao_avaliado` antes do submit. |
| `street_access_type` | `text CHECK ∈ {Rua_larga,Rua_estreita,Rua_sem_saida,Viela,Nao_informado}` | UI envia "Rua Larga", etc. | `Select` usa `streetAccessTypeOptions`: labels amigáveis → tokens (`Rua_larga`, ...); opção "Estrada de Terra" foi removida. |
| `external_stairs` | `text` | Não usado | Sem campo; ação não envia. |
| `has_24h_concierge` | `boolean DEFAULT false` | TabAddress lê/escreve (`has24hConcierge`) | OK. |
| `concierge_contact` | `text` | TabAddress lê/escreve | OK. |
| `area_risk_type` | `text` | TabAddress lê/escreve (`areaRiskType`) | Sem CHECK no banco; livre. |
| `cell_signal_quality` | `text CHECK ∈ {Bom,Razoavel,Ruim,Nao_informado}` | TabAddress lê/escreve (`cellSignalQuality`) | Labels "Razoável"/"Ruim" mapeados para tokens; opção "Inexistente" removida em favor de `Nao_informado`. |
| `power_outlets_desc` | `text` | TabAddress lê/escreve (`powerOutletsDesc`) | OK. |
| `equipment_space` | `text CHECK ∈ {Adequado,Restrito,Critico,Nao_avaliado}` | TabAddress lê/escreve | OK. |
| `geo_latitude` | `numeric` | TabAddress lê/escreve (`geoLatitude`) | Persistido corretamente. |
| `geo_longitude` | `numeric` | TabAddress lê/escreve (`geoLongitude`) | Persistido corretamente. |
| `ambulance_access` | `text CHECK ∈ {Total,Parcial,Dificil,Nao_acessa,Nao_informado}` | TabAddress lê/escreve (`ambulanceAccess`) | Labels "Difícil"/"Não acessa" mapeados; o valor agora é gravado apenas em `patient_addresses`. |
| `parking` | `text` | TabAddress lê/escreve (`parking`) | Campo passa a receber `parking` + `teamParking` (prefixo `Equipe:`) para preservar todos os detalhes. |
| `entry_procedure` | `text` | TabAddress lê/escreve (input) | Persistido somente em `patient_addresses`; `patient_domiciles` ficou somente leitura. |
| `night_access_risk` | `text CHECK ∈ {Baixo,Medio,Alto,Nao_avaliado}` | TabAddress lê/escreve (`nightAccessRisk`) | Labels "Baixo/Médio/Alto" convertem para tokens (`Baixo`,`Medio`,`Alto`). |
| `has_wifi` | `boolean DEFAULT false` | TabAddress lê/escreve | Campo agora é canônico em `patient_addresses`; action não atualiza mais `patient_domiciles`. |
| `has_smokers` | `boolean DEFAULT false` | TabAddress lê/escreve | Mesmo tratamento de canonicidade em `patient_addresses`. |
| `animal_behavior` | `text CHECK ∈ {Doces,Bravos,Necessitam_contencao,Nao_informado}` | TabAddress lê/escreve (`animalsBehavior`) | OK. |
| `bed_type` | `text CHECK ∈ {Hospitalar,...}` | TabAddress lê/escreve | Campo agora persiste apenas em `patient_addresses`; leitura do domicílio serve como fallback legacy. |
| `mattress_type` | `text CHECK ∈ {Pneumatico,Viscoelastico,...}` | TabAddress lê/escreve | Mesmo comportamento de canonicidade. |
| `electric_infra` | `text CHECK ∈ {110,220,Bivolt,Nao_informada}` | TabAddress lê/escreve (`electricInfra`) | Seleção exibe "110v"/"Instável" mas envia `110`, `220`, `Bivolt` ou `Nao_informada`. |
| `backup_power` | `text CHECK ∈ {Nenhuma,Gerador,Nobreak,Outros,Nao_informado}` | TabAddress lê/escreve (`backupPower`) | Opção "Rede Dupla" mapeada para `Outros`; "Nenhum" ajustado para `Nenhuma`. |
| `water_source` | `text CHECK ∈ {Rede_publica,Poco_artesiano,Cisterna,Outro,Nao_informado}` | TabAddress lê/escreve | OK. |
| `adapted_bathroom` | `boolean DEFAULT false` | TabAddress lê/escreve | OK. |
| `pets_description` | `text` | TabAddress lê/escreve (`petsDescription`) | Textos (ou flags booleanas de `pets`) agora são gravados diretamente em `patient_addresses.pets_description`. |
| `backup_power_desc` | `text` | Não usado | Nenhuma action escreve. |
| `general_observations` | `text` | TabAddress lê/escreve (`notes`) | `notes`, `stayLocation` e `generalObservations` legados são consolidados aqui. |

## 2. Campos da TabAddress × persistência

| Campo UI (`PatientAddressForm`) | Lido do banco? | Editável? | Persistido em qual coluna? | Notas |
| --- | --- | --- | --- | --- |
| `zipCode` | `patient_addresses.zip_code` | Sim | `patient_addresses.zip_code` | Server aceita só 8 dígitos, formata para `00000-000` e verifica o CEP/UF na BrasilAPI no submit. |
| `addressLine` | `patient_addresses.street` | Sim | `patient_addresses.street` | — |
| `number` | `patient_addresses.number` | Sim | `patient_addresses.number` | — |
| `neighborhood` | `patient_addresses.neighborhood` | Sim | `patient_addresses.neighborhood` | — |
| `city` | `patient_addresses.city` | Sim | `patient_addresses.city` | — |
| `state` | `patient_addresses.state` | Sim | `patient_addresses.state` | Schema e server forçam uppercase e a ação rejeita UFs inválidas ou divergentes do CEP. |
| `complement` | `patient_addresses.complement` | Sim | `patient_addresses.complement` | — |
| `referencePoint` | `patient_addresses.reference_point` | Sim | `patient_addresses.reference_point` | — |
| `zoneType` | `patient_addresses.zone_type` | Sim | `patient_addresses.zone_type` | Valores compatíveis. |
| `city`, `state`, `addressLine` via CEP | Sim | Sim | Idem | CEP aplica `fetchCep`. |
| `travelNotes` | `patient_addresses.travel_notes` (fallback domicílio) | Sim | `patient_addresses.travel_notes` | Campo principal "Informações para o motorista"; action concatena `worksOrObstacles` no mesmo texto. |
| `geoLatitude`/`geoLongitude` | `patient_addresses.geo_latitude/geo_longitude` | Sim | `patient_addresses.geo_latitude/geo_longitude` | Persistem ok. |
| `geoLat` / `geoLng` | Não (colunas inexistentes) | Não exibidos | **Não existe coluna** | Payload envia `geo_lat`/`geo_lng` → Supabase rejeita. |
| `propertyType` | `patient_addresses.property_type` | Sim | `patient_addresses.property_type` | — |
| `condoName` | `patient_addresses.condo_name` | Sim | `patient_addresses.condo_name` | — |
| `blockTower` | `patient_addresses.block_tower` | Sim | `patient_addresses.block_tower` | — |
| `floorNumber` | `patient_addresses.floor_number` | Sim | `patient_addresses.floor_number` | — |
| `unitNumber` | `patient_addresses.unit_number` | Sim | `patient_addresses.unit_number` | — |
| `ambulanceAccess` | `patient_addresses.ambulance_access` (fallback: `patient_domiciles.ambulance_access`) | Sim | `patient_addresses.ambulance_access` | UI lê do endereço (e, se vazio, do domicílio). Persistência acontece **apenas** na tabela `patient_addresses` com labels normalizados. |
| `wheelchairAccess` | `patient_addresses.wheelchair_access` | Sim | `patient_addresses.wheelchair_access` | Labels resolvidos via `resolveAddressEnumValue`; sem risco de violar CHECK. |
| `elevatorStatus` | `patient_addresses.elevator_status` | Sim | `patient_addresses.elevator_status` | Mesma estratégia de normalização. |
| `streetAccessType` | `patient_addresses.street_access_type` | Sim | `patient_addresses.street_access_type` | Usa `streetAccessTypeOptions`; valores como "Rua larga" → `Rua_larga`. |
| `parking` | `patient_addresses.parking` | Sim | `patient_addresses.parking` | Texto principal. |
| `teamParking` | `patient_domiciles.team_parking` | Sim | `patient_addresses.parking` (prefixo `Equipe:`) | Campo não existe em `patient_addresses`; action concatena conteúdo em `parking` para manter histórico. Domicílio virou somente leitura. |
| `has24hConcierge` | `patient_addresses.has_24h_concierge` | Sim | `patient_addresses.has_24h_concierge` | — |
| `conciergeContact` | `patient_addresses.concierge_contact` | Sim | `patient_addresses.concierge_contact` | — |
| `entryProcedure` | `patient_addresses.entry_procedure` | Sim | `patient_addresses.entry_procedure` | Tabela do domicílio não recebe mais atualizações. |
| `nightAccessRisk` | `patient_addresses.night_access_risk` (fallback domicílio) | Sim | `patient_addresses.night_access_risk` | Enum agora usa tokens `Baixo/Medio/Alto/Nao_avaliado`; domicílio apenas fornece dados legados. |
| `areaRiskType` | `patient_addresses.area_risk_type` | Sim | `patient_addresses.area_risk_type` | Sem CHECK. |
| `worksOrObstacles` | `patient_addresses.travel_notes` | Sim | `patient_addresses.travel_notes` | Texto do campo é anexado como "Obras/obstáculos" dentro do `travel_notes`. |
| `travelNotes` (segundo textarea "Observações de acesso") | `patient_addresses.travel_notes` | Sim | `patient_addresses.travel_notes` | `travelNotes` + `worksOrObstacles` são consolidados num único campo multiline. |
| `hasWifi` | `patient_addresses.has_wifi` (fallback domicílio) | Sim (checkbox) | `patient_addresses.has_wifi` | Checkbox agora é canônico na tabela de endereços; domicílio só fornece leitura legada. |
| `hasSmokers` | `patient_addresses.has_smokers` (fallback domicílio) | Sim | `patient_addresses.has_smokers` | Mesmo comportamento. |
| `adaptedBathroom` | `patient_addresses.adapted_bathroom` | Sim | `patient_addresses.adapted_bathroom` | — |
| `electricInfra` | `patient_addresses.electric_infra` | Sim | `patient_addresses.electric_infra` | Valores do select são traduzidos via `resolveAddressEnumValue` (`110v`→`110`, "Instável"→`Nao_informada`). |
| `backupPower` | `patient_addresses.backup_power` | Sim | `patient_addresses.backup_power` | `backupPowerOptions` garante `Outros` para "Rede Dupla" e `Nenhuma` para "Nenhum". |
| `cellSignalQuality` | `patient_addresses.cell_signal_quality` | Sim | `patient_addresses.cell_signal_quality` | Opção "Inexistente" foi removida; usamos `Nao_informado`. |
| `powerOutletsDesc` | `patient_addresses.power_outlets_desc` | Sim | `patient_addresses.power_outlets_desc` | — |
| `equipmentSpace` | `patient_addresses.equipment_space` | Sim | `patient_addresses.equipment_space` | — |
| `waterSource` | `patient_addresses.water_source` (fallback domicílio) | Sim | `patient_addresses.water_source` | Tabela do domicílio não é mais atualizada. |
| `bedType` | `patient_addresses.bed_type` (fallback domicílio) | Sim | `patient_addresses.bed_type` | Persistência centralizada; domicílio mantém apenas valores históricos. |
| `mattressType` | `patient_addresses.mattress_type` (fallback domicílio) | Sim | `patient_addresses.mattress_type` | Idem. |
| `petsDescription` | `patient_addresses.pets_description` | Sim | `patient_addresses.pets_description` | UI envia descrição digitada ou derivada do campo `pets`. |
| `animalsBehavior` | `patient_addresses.animal_behavior` (fallback domicílio) | Sim | `patient_addresses.animal_behavior` | Apenas leitura legada no domicílio. |
| `notes` (observações gerais) | `patient_addresses.general_observations` | Sim | `patient_addresses.general_observations` | `notes`, `generalObservations` (legacy) e `stayLocation` são concatenados antes do submit. |
| `stayLocation`, `pets`, `voltage`, `backupPowerSource`, `generalObservations` | Valores default carregados | `stayLocation` & `generalObservations`: Sim (sem inputs dedicados) | `stayLocation` → anotação dentro de `general_observations`; `pets` alimenta `pets_description`. `voltage` e `backup_power_source` seguem apenas no domicílio por enquanto (sem submit). |
| `householdMembers` | `patient_household_members` | Editável via UI? (não na Tab atual) | Persistido em `patient_household_members` | Gestão feita no submit (delete+insert). |

## 3. Campos exibidos na UI sem coluna dedicada

- `teamParking` → segue sem coluna própria em `patient_addresses`. Agora o valor é concatenado no texto de `parking` (com prefixo `Equipe:`) antes do submit.
- `worksOrObstacles` → não existe `works_or_obstacles` no schema; conteúdo passa a ser anexado ao `travel_notes` como bloco "Obras/obstáculos".
- `stayLocation` → permanece sem coluna específica; a action injeta o valor dentro de `general_observations` com o rótulo "Local de permanência".
- `pets` (boolean/lista/objeto legado) → continua sem coluna direta; os valores são serializados para `pets_description` quando `petsDescription` não é informado manualmente.
- `geoLat` / `geoLng` → inputs são apenas aliases; os valores são gravados em `geo_latitude`/`geo_longitude` (colunas existentes). Ainda existem campos `geo_lat`/`geo_lng` legados sendo enviados no payload, mas o banco ignora por não ter as colunas.

## 4. Colunas do banco sem representação na UI

- `facade_image_url`, `allowed_visit_hours`, `eta_minutes`, `external_stairs`, `backup_power_desc` continuam sem inputs. Ainda não há decisão sobre remoção ou futura exposição.
- `backup_power_desc` poderia capturar o texto livre sobre redundância de energia; atualmente só usamos o enum `backup_power`.
- `voltage` e `backup_power_source` existem apenas em `patient_domiciles` e não possuem UI; payload mantém valores carregados, mas não permite edição.
- `householdMembers` segue gerenciado fora desta aba (a action ainda faz delete + insert).

## 5. Plano de alinhamento proposto (sem aplicar)

| Item | Problema | Status / Próximos passos |
| --- | --- | --- |
| A1 | Campos básicos (`street`, `number`, `neighborhood`, `city`, `state`, `zip_code`, `complement`, `reference_point`, `zone_type`) são canônicos nesta tabela. | ✅ Concluído: schema normaliza UF/CEP e o server valida CEP × UF (BrasilAPI) antes do upsert. |
| A2 | Campos de logística duplicados entre `patient_addresses` e `patient_domiciles`. | ✅ TabAddress agora grava somente em `patient_addresses`; o domicílio ficou somente leitura (fallback). Limpeza de colunas antigas permanece como follow-up. |
| A3 | UI enviava valores fora dos CHECKs. | ✅ `src/data/definitions/address.ts` + `resolveAddressEnumValue` alinharam labels e tokens. |
| A4 | Campos inexistentes no DB (`team_parking`, `works_or_obstacles`, `notes`, `stay_location`, `pets`). | ✅ Payload converte cada campo para colunas válidas (`parking`, `travel_notes`, `general_observations`, `pets_description`). `geo_lat`/`geo_lng` legados ainda aparecem no payload, mas são ignorados pelo Supabase. |
| A5 | Colunas não expostas (facade, allowed_visit_hours, eta_minutes, backup_power_desc). | ⏳ Segue em backlog; nenhuma UI adicionada. |
| A6 | `pets_description` só recebia dados via `patient_domiciles`. | ✅ `petsDescription` (ou dados derivados de `pets`) agora alimenta `patient_addresses.pets_description`. |
| A7 | Campos enviados sem UI (`voltage`, `backupPowerSource`). | ⚠️ Continua sem solução. Precisamos decidir entre expor inputs, mover para endereço ou aposentar do payload. |
| A8 | `householdMembers` CRUD apaga e reinsere tudo a cada submit. | 💤 Ainda não tratado. Registrar em backlog separado. |

Este contrato reflete o estado atual após normalização dos enums, validação de CEP/UF, consolidação do payload e preparação do gancho de auditoria. Use esta versão como baseline para as próximas iterações (limpeza de colunas legadas e melhoria do CRUD de familiares).
