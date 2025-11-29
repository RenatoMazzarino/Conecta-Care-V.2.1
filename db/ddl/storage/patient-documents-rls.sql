-- RLS para arquivos do bucket "patient-documents"
-- IMPORTANTE: executar manualmente no console SQL do Supabase usando uma role owner/superuser.
-- Não automatizar em migrations se o ambiente não tiver permissão no schema "storage".

-- 1) Habilitar RLS na tabela de objetos do storage (idempotente)
alter table storage.objects enable row level security;

-- 2) Política de SELECT para usuários autenticados
-- Regra: permitir SELECT apenas se o objeto pertence ao bucket "patient-documents"
-- e houver um registro correspondente em public.patient_documents cujo file_path
-- seja igual ao caminho do objeto, respeitando as mesmas regras de visibilidade
-- já aplicadas na RLS de patient_documents.
create policy if not exists patient_documents_files_select_authenticated
on storage.objects
for select
to authenticated
using (
  bucket_id = 'patient-documents'
  and exists (
    select 1
    from public.patient_documents d
    where d.file_path = storage.objects.name
      and (
        d.is_visible_admin = true
        or (
          d.is_visible_clinical = true
          and exists (
            select 1
            from public.user_profiles up
            join public.care_team_members cm on cm.user_profile_id = up.id
            where up.auth_user_id = auth.uid()
              and cm.patient_id = d.patient_id
              and (cm.start_date is null or cm.start_date <= now())
              and (cm.end_date is null or cm.end_date >= now())
          )
        )
      )
  )
);

-- Observações:
-- * Uploads/remoções continuam sendo feitos via backend com service-role,
--   portanto não criamos policies de INSERT/DELETE neste momento.
-- * Caso seja necessário restringir uploads por usuários finais no futuro,
--   adicionar policies específicas seguindo o mesmo padrão.
