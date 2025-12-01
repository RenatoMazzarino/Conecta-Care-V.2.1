CREATE TABLE auth.audit_log_entries (
  instance_id uuid,
  id uuid PRIMARY KEY,
  payload json,
  created_at timestamp with time zone,
  ip_address character varying(64) NOT NULL DEFAULT ''::character varying
);
CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries (instance_id);
COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';

CREATE TABLE auth.flow_state (
  id uuid PRIMARY KEY,
  user_id uuid,
  auth_code text NOT NULL,
  code_challenge_method auth.code_challenge_method NOT NULL,
  code_challenge text NOT NULL,
  provider_type text NOT NULL,
  provider_access_token text,
  provider_refresh_token text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  authentication_method text NOT NULL,
  auth_code_issued_at timestamp with time zone
);
CREATE INDEX flow_state_created_at_idx ON auth.flow_state (created_at);
CREATE INDEX idx_auth_code ON auth.flow_state (auth_code);
CREATE INDEX idx_user_id_auth_method ON auth.flow_state (user_id, authentication_method);
COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';

CREATE TABLE auth.identities (
  provider_id text NOT NULL,
  user_id uuid NOT NULL,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  email text DEFAULT 'lower((identity_data ->> 'email'::text))',
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  UNIQUE (provider_id, provider)
);
CREATE INDEX identities_email_idx ON auth.identities (email);
CREATE INDEX identities_user_id_idx ON auth.identities (user_id);
COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';
COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';

CREATE TABLE auth.instances (
  id uuid PRIMARY KEY,
  uuid uuid,
  raw_base_config text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';

CREATE TABLE auth.mfa_amr_claims (
  session_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  authentication_method text NOT NULL,
  id uuid PRIMARY KEY,
  UNIQUE (session_id, authentication_method)
);
COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';

CREATE TABLE auth.mfa_challenges (
  id uuid PRIMARY KEY,
  factor_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  verified_at timestamp with time zone,
  ip_address inet NOT NULL,
  otp_code text,
  web_authn_session_data jsonb
);
CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges (created_at);
COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';

CREATE TABLE auth.mfa_factors (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  friendly_name text,
  factor_type auth.factor_type NOT NULL,
  status auth.factor_status NOT NULL,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  secret text,
  phone text,
  last_challenged_at timestamp with time zone UNIQUE,
  web_authn_credential jsonb,
  web_authn_aaguid uuid,
  last_webauthn_challenge_data jsonb,
  UNIQUE (friendly_name, user_id),
  UNIQUE (user_id, phone)
);
CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors (user_id, created_at);
CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors (user_id);
COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';
COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';
ALTER TABLE auth.mfa_challenges ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id);

CREATE TABLE auth.oauth_authorizations (
  id uuid PRIMARY KEY,
  authorization_id text NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  user_id uuid,
  redirect_uri text NOT NULL CHECK (CHECK (char_length(redirect_uri) <= 2048)),
  scope text NOT NULL CHECK (CHECK (char_length(scope) <= 4096)),
  state text CHECK (CHECK (char_length(state) <= 4096)),
  resource text CHECK (CHECK (char_length(resource) <= 2048)),
  code_challenge text CHECK (CHECK (char_length(code_challenge) <= 128)),
  code_challenge_method auth.code_challenge_method,
  response_type auth.oauth_response_type NOT NULL DEFAULT 'code'::auth.oauth_response_type,
  status auth.oauth_authorization_status NOT NULL DEFAULT 'pending'::auth.oauth_authorization_status,
  authorization_code text UNIQUE CHECK (CHECK (char_length(authorization_code) <= 255)),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:03:00'::interval),
  approved_at timestamp with time zone,
  nonce text CHECK (CHECK (char_length(nonce) <= 255))
);
CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations (expires_at);

CREATE TABLE auth.oauth_clients (
  id uuid PRIMARY KEY,
  client_secret_hash text,
  registration_type auth.oauth_registration_type NOT NULL,
  redirect_uris text NOT NULL,
  grant_types text NOT NULL,
  client_name text CHECK (CHECK (char_length(client_name) <= 1024)),
  client_uri text CHECK (CHECK (char_length(client_uri) <= 2048)),
  logo_uri text CHECK (CHECK (char_length(logo_uri) <= 2048)),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  client_type auth.oauth_client_type NOT NULL DEFAULT 'confidential'::auth.oauth_client_type
);
CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients (deleted_at);
ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id);

CREATE TABLE auth.oauth_consents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES auth.oauth_clients(id),
  scopes text NOT NULL CHECK (CHECK (char_length(scopes) <= 2048)),
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  UNIQUE (user_id, client_id)
);
CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents (client_id);
CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents (user_id, client_id);
CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents (user_id, granted_at);

CREATE TABLE auth.one_time_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  token_type auth.one_time_token_type NOT NULL,
  token_hash text NOT NULL CHECK (CHECK (char_length(token_hash) > 0)),
  relates_to text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, token_type)
);
CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens (relates_to);
CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens (token_hash);

CREATE TABLE auth.refresh_tokens (
  instance_id uuid,
  id bigint PRIMARY KEY DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass),
  token character varying(255) UNIQUE,
  user_id character varying(255),
  revoked boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  parent character varying(255),
  session_id uuid
);
CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens (instance_id);
CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens (instance_id, user_id);
CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens (parent);
CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens (session_id, revoked);
CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens (updated_at);
COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';

CREATE TABLE auth.saml_providers (
  id uuid PRIMARY KEY,
  sso_provider_id uuid NOT NULL,
  entity_id text NOT NULL UNIQUE CHECK (CHECK (char_length(entity_id) > 0)),
  metadata_xml text NOT NULL CHECK (CHECK (char_length(metadata_xml) > 0)),
  metadata_url text CHECK (CHECK (metadata_url = NULL::text OR char_length(metadata_url) > 0)),
  attribute_mapping jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  name_id_format text
);
CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers (sso_provider_id);
COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';

CREATE TABLE auth.saml_relay_states (
  id uuid PRIMARY KEY,
  sso_provider_id uuid NOT NULL,
  request_id text NOT NULL CHECK (CHECK (char_length(request_id) > 0)),
  for_email text,
  redirect_to text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  flow_state_id uuid REFERENCES auth.flow_state(id)
);
CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states (created_at);
CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states (for_email);
CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states (sso_provider_id);
COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';

CREATE TABLE auth.schema_migrations (
  version character varying(255) PRIMARY KEY
);
COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';

CREATE TABLE auth.sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  factor_id uuid,
  aal auth.aal_level,
  not_after timestamp with time zone,
  refreshed_at timestamp without time zone,
  user_agent text,
  ip inet,
  tag text,
  oauth_client_id uuid REFERENCES auth.oauth_clients(id),
  refresh_token_hmac_key text,
  refresh_token_counter bigint,
  scopes text CHECK (CHECK (char_length(scopes) <= 4096))
);
CREATE INDEX sessions_not_after_idx ON auth.sessions (not_after);
CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions (oauth_client_id);
CREATE INDEX sessions_user_id_idx ON auth.sessions (user_id);
CREATE INDEX user_id_created_at_idx ON auth.sessions (user_id, created_at);
COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';
COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';
COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';
COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';
ALTER TABLE auth.mfa_amr_claims ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id);
ALTER TABLE auth.refresh_tokens ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id);

CREATE TABLE auth.sso_domains (
  id uuid PRIMARY KEY,
  sso_provider_id uuid NOT NULL,
  domain text NOT NULL CHECK (CHECK (char_length(domain) > 0)),
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains (sso_provider_id);
COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';

CREATE TABLE auth.sso_providers (
  id uuid PRIMARY KEY,
  resource_id text CHECK (CHECK (resource_id = NULL::text OR char_length(resource_id) > 0)),
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  disabled boolean
);
CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers (resource_id);
COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';
COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';
ALTER TABLE auth.saml_providers ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.saml_relay_states ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);
ALTER TABLE auth.sso_domains ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id);

CREATE TABLE auth.users (
  instance_id uuid,
  id uuid PRIMARY KEY,
  aud character varying(255),
  role character varying(255),
  email character varying(255) UNIQUE,
  encrypted_password character varying(255),
  email_confirmed_at timestamp with time zone,
  invited_at timestamp with time zone,
  confirmation_token character varying(255) UNIQUE,
  confirmation_sent_at timestamp with time zone,
  recovery_token character varying(255) UNIQUE,
  recovery_sent_at timestamp with time zone,
  email_change_token_new character varying(255) UNIQUE,
  email_change character varying(255),
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  phone text UNIQUE DEFAULT 'NULL::character varying',
  phone_confirmed_at timestamp with time zone,
  phone_change text DEFAULT '''::character varying',
  phone_change_token character varying(255) DEFAULT ''::character varying,
  phone_change_sent_at timestamp with time zone,
  confirmed_at timestamp with time zone DEFAULT LEAST(email_confirmed_at, phone_confirmed_at),
  email_change_token_current character varying(255) UNIQUE DEFAULT ''::character varying,
  email_change_confirm_status smallint CHECK (CHECK (email_change_confirm_status >= 0 AND email_change_confirm_status <= 2)) DEFAULT 0,
  banned_until timestamp with time zone,
  reauthentication_token character varying(255) UNIQUE DEFAULT ''::character varying,
  reauthentication_sent_at timestamp with time zone,
  is_sso_user boolean NOT NULL DEFAULT false,
  deleted_at timestamp with time zone,
  is_anonymous boolean NOT NULL DEFAULT false
);
CREATE INDEX users_instance_id_email_idx ON auth.users (instance_id, *expression*);
CREATE INDEX users_instance_id_idx ON auth.users (instance_id);
CREATE INDEX users_is_anonymous_idx ON auth.users (is_anonymous);
COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';
COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';
ALTER TABLE auth.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.oauth_authorizations ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.oauth_consents ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.one_time_tokens ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE auth.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE TABLE extensions.pg_stat_statements (
  userid oid,
  dbid oid,
  toplevel boolean,
  queryid bigint,
  query text,
  plans bigint,
  total_plan_time double precision,
  min_plan_time double precision,
  max_plan_time double precision,
  mean_plan_time double precision,
  stddev_plan_time double precision,
  calls bigint,
  total_exec_time double precision,
  min_exec_time double precision,
  max_exec_time double precision,
  mean_exec_time double precision,
  stddev_exec_time double precision,
  rows bigint,
  shared_blks_hit bigint,
  shared_blks_read bigint,
  shared_blks_dirtied bigint,
  shared_blks_written bigint,
  local_blks_hit bigint,
  local_blks_read bigint,
  local_blks_dirtied bigint,
  local_blks_written bigint,
  temp_blks_read bigint,
  temp_blks_written bigint,
  shared_blk_read_time double precision,
  shared_blk_write_time double precision,
  local_blk_read_time double precision,
  local_blk_write_time double precision,
  temp_blk_read_time double precision,
  temp_blk_write_time double precision,
  wal_records bigint,
  wal_fpi bigint,
  wal_bytes numeric,
  jit_functions bigint,
  jit_generation_time double precision,
  jit_inlining_count bigint,
  jit_inlining_time double precision,
  jit_optimization_count bigint,
  jit_optimization_time double precision,
  jit_emission_count bigint,
  jit_emission_time double precision,
  jit_deform_count bigint,
  jit_deform_time double precision,
  stats_since timestamp with time zone,
  minmax_stats_since timestamp with time zone
);

CREATE TABLE extensions.pg_stat_statements_info (
  dealloc bigint,
  stats_reset timestamp with time zone
);

CREATE TABLE public.billing_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  contractor_id uuid NOT NULL,
  competence_month date NOT NULL,
  status text CHECK (CHECK (status = ANY (ARRAY['open'::text, 'closed'::text, 'invoiced'::text, 'paid'::text]))) DEFAULT ''open'::text',
  total_amount numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.care_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  user_profile_id uuid,
  role_in_case care_team_role NOT NULL,
  is_reference_professional boolean DEFAULT false,
  regime care_team_regime DEFAULT 'Fixo'::care_team_regime,
  work_window_summary text,
  status text NOT NULL CHECK (CHECK ((status = ANY (ARRAY['Ativo'::text, 'Afastado'::text, 'Encerrado'::text, 'Standby'::text])) OR status IS NULL)) DEFAULT ''Ativo'::text',
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  contact_info_override text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  professional_category text CHECK (CHECK ((professional_category = ANY (ARRAY['Medico'::text, 'Enfermeiro'::text, 'TecnicoEnfermagem'::text, 'Fisioterapeuta'::text, 'Nutricionista'::text, 'Psicologo'::text, 'AssistenteSocial'::text, 'Cuidador'::text, 'Fonoaudiologo'::text, 'TerapeutaOcupacional'::text, 'Outro'::text])) OR professional_category IS NULL)),
  is_technical_responsible boolean DEFAULT false,
  is_family_focal_point boolean DEFAULT false,
  contact_email text,
  contact_phone text,
  work_window text,
  employment_type text CHECK (CHECK ((employment_type = ANY (ARRAY['CLT'::text, 'PJ'::text, 'Cooperado'::text, 'Terceirizado'::text, 'Autonomo'::text, 'Outro'::text])) OR employment_type IS NULL)),
  internal_extension text,
  corporate_cell text,
  profissional_nome text
);
CREATE INDEX idx_care_team_members_user_patient_dates ON public.care_team_members (user_profile_id, patient_id, start_date, end_date);
CREATE INDEX idx_team_patient ON public.care_team_members (patient_id);

CREATE TABLE public.contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  name text NOT NULL,
  commercial_name text,
  document_number text,
  type text NOT NULL CHECK (CHECK (type = ANY (ARRAY['health_plan'::text, 'public_entity'::text, 'private_individual'::text]))),
  billing_due_days integer DEFAULT 30,
  integration_code text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.billing_batches ADD CONSTRAINT billing_batches_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id);

CREATE TABLE public.financial_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  entry_type text NOT NULL CHECK (CHECK (entry_type = ANY (ARRAY['Cobranca_Recorrente'::text, 'Insumo_Extra'::text, 'Ajuste_Credito'::text, 'Ajuste_Debito'::text, 'Pagamento_Recebido'::text]))),
  description text NOT NULL,
  amount_due numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  status text CHECK (CHECK (status = ANY (ARRAY['Aberto'::text, 'Pago'::text, 'Parcial'::text, 'Vencido'::text, 'Cancelado'::text, 'Em_Contestacao'::text]))) DEFAULT ''pending'::text',
  invoice_number text,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reference_period date
);
CREATE INDEX idx_ledger_patient ON public.financial_ledger_entries (patient_id);
CREATE INDEX idx_ledger_status ON public.financial_ledger_entries (status);

CREATE TABLE public.financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  billing_batch_id uuid REFERENCES public.billing_batches(id),
  contractor_id uuid REFERENCES public.contractors(id),
  type text NOT NULL CHECK (CHECK (type = ANY (ARRAY['receivable'::text, 'payable'::text]))),
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  status text CHECK (CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'canceled'::text]))) DEFAULT ''pending'::text',
  description text,
  created_at timestamp with time zone DEFAULT now(),
  patient_id uuid
);
CREATE INDEX idx_financial_patient ON public.financial_records (patient_id);

CREATE TABLE public.integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  provider text NOT NULL CHECK (CHECK (provider = ANY (ARRAY['conta_azul'::text, 'pagar_me'::text, 'celcoin'::text, 'asaas'::text]))),
  environment text CHECK (CHECK (environment = ANY (ARRAY['sandbox'::text, 'production'::text]))) DEFAULT ''sandbox'::text',
  api_key text,
  api_secret text,
  webhook_url text,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  name text NOT NULL,
  sku text,
  category text,
  is_trackable boolean DEFAULT false,
  unit_of_measure text,
  brand text,
  model text,
  description text,
  min_stock_level integer DEFAULT 10
);

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  patient_id uuid,
  movement_type text NOT NULL,
  quantity numeric NOT NULL,
  related_asset_id uuid,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamp with time zone DEFAULT now(),
  notes text
);

CREATE TABLE public.patient_addresses (
  patient_id uuid PRIMARY KEY,
  street text NOT NULL,
  number text NOT NULL,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL CHECK (CHECK (state ~ '^[A-Z]{2}$'::text OR state IS NULL)),
  zip_code text,
  complement text,
  reference_point text,
  zone_type text CHECK (CHECK ((zone_type = ANY (ARRAY['Urbana'::text, 'Rural'::text, 'Periurbana'::text, 'Comunidade'::text, 'Risco'::text, 'Nao_informada'::text])) OR zone_type IS NULL)),
  facade_image_url text,
  allowed_visit_hours text,
  travel_notes text,
  eta_minutes integer,
  property_type text CHECK (CHECK ((property_type = ANY (ARRAY['Casa'::text, 'Apartamento'::text, 'Chacara_Sitio'::text, 'ILPI'::text, 'Pensão'::text, 'Comercial'::text, 'Outro'::text, 'Nao_informado'::text])) OR property_type IS NULL)),
  condo_name text,
  block_tower text,
  floor_number integer,
  unit_number text,
  elevator_status text CHECK (CHECK ((elevator_status = ANY (ARRAY['Nao_tem'::text, 'Tem_nao_comporta_maca'::text, 'Tem_comporta_maca'::text, 'Nao_informado'::text])) OR elevator_status IS NULL)),
  wheelchair_access text CHECK (CHECK ((wheelchair_access = ANY (ARRAY['Livre'::text, 'Com_restricao'::text, 'Incompativel'::text, 'Nao_avaliado'::text])) OR wheelchair_access IS NULL)),
  street_access_type text CHECK (CHECK ((street_access_type = ANY (ARRAY['Rua_larga'::text, 'Rua_estreita'::text, 'Rua_sem_saida'::text, 'Viela'::text, 'Nao_informado'::text])) OR street_access_type IS NULL)),
  external_stairs text,
  has_24h_concierge boolean DEFAULT false,
  concierge_contact text,
  area_risk_type text,
  cell_signal_quality text CHECK (CHECK ((cell_signal_quality = ANY (ARRAY['Bom'::text, 'Razoavel'::text, 'Ruim'::text, 'Nao_informado'::text])) OR cell_signal_quality IS NULL)),
  power_outlets_desc text,
  equipment_space text CHECK (CHECK ((equipment_space = ANY (ARRAY['Adequado'::text, 'Restrito'::text, 'Critico'::text, 'Nao_avaliado'::text])) OR equipment_space IS NULL)),
  geo_latitude numeric,
  geo_longitude numeric,
  ambulance_access text CHECK (CHECK ((ambulance_access = ANY (ARRAY['Total'::text, 'Parcial'::text, 'Dificil'::text, 'Nao_acessa'::text, 'Nao_informado'::text])) OR ambulance_access IS NULL)),
  parking text,
  entry_procedure text,
  night_access_risk text CHECK (CHECK ((night_access_risk = ANY (ARRAY['Baixo'::text, 'Medio'::text, 'Alto'::text, 'Nao_avaliado'::text])) OR night_access_risk IS NULL)),
  has_wifi boolean DEFAULT false,
  has_smokers boolean DEFAULT false,
  animal_behavior text CHECK (CHECK ((animal_behavior = ANY (ARRAY['Doces'::text, 'Bravos'::text, 'Necessitam_contencao'::text, 'Nao_informado'::text])) OR animal_behavior IS NULL)),
  bed_type text CHECK (CHECK ((bed_type = ANY (ARRAY['Hospitalar'::text, 'Articulada'::text, 'Comum'::text, 'Colchao_no_chao'::text, 'Outro'::text, 'Nao_informado'::text])) OR bed_type IS NULL)),
  mattress_type text CHECK (CHECK ((mattress_type = ANY (ARRAY['Pneumatico'::text, 'Viscoelastico'::text, 'Espuma_comum'::text, 'Mola'::text, 'Outro'::text, 'Nao_informado'::text])) OR mattress_type IS NULL)),
  electric_infra text CHECK (CHECK ((electric_infra = ANY (ARRAY['110'::text, '220'::text, 'Bivolt'::text, 'Nao_informada'::text])) OR electric_infra IS NULL)),
  backup_power text CHECK (CHECK ((backup_power = ANY (ARRAY['Nenhuma'::text, 'Gerador'::text, 'Nobreak'::text, 'Outros'::text, 'Nao_informado'::text])) OR backup_power IS NULL)),
  water_source text CHECK (CHECK ((water_source = ANY (ARRAY['Rede_publica'::text, 'Poco_artesiano'::text, 'Cisterna'::text, 'Outro'::text, 'Nao_informado'::text])) OR water_source IS NULL)),
  adapted_bathroom boolean DEFAULT false,
  pets_description text,
  backup_power_desc text,
  general_observations text
);

CREATE TABLE public.patient_admin_info (
  patient_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  status text DEFAULT ''Ativo'::text',
  admission_type text,
  complexity text,
  service_package text,
  start_date date,
  end_date date,
  supervisor_id uuid,
  escalista_id uuid,
  nurse_responsible_id uuid,
  frequency text,
  operation_area text,
  admission_source text,
  contract_id text,
  notes_internal text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  demand_origin text,
  primary_payer_type text CHECK (CHECK ((primary_payer_type = ANY (ARRAY['Operadora'::text, 'PessoaFisica'::text, 'Empresa'::text, 'OrgaoPublico'::text, 'Outro'::text])) OR primary_payer_type IS NULL)),
  contract_start_date date,
  contract_end_date date,
  renewal_type renewal_type_enum,
  external_contract_id text,
  authorization_number text,
  judicial_case_number text,
  status_reason text,
  status_changed_at timestamp with time zone,
  commercial_responsible_id uuid,
  contract_manager_id uuid,
  scale_rule_start_date date,
  scale_rule_end_date date,
  scale_mode text,
  scale_notes text,
  chk_contract_ok boolean DEFAULT false,
  chk_contract_at date,
  chk_contract_by text,
  chk_consent_ok boolean DEFAULT false,
  chk_consent_at date,
  chk_consent_by text,
  chk_medical_report_ok boolean DEFAULT false,
  chk_medical_report_at date,
  chk_medical_report_by text,
  chk_legal_docs_ok boolean DEFAULT false,
  chk_financial_docs_ok boolean DEFAULT false,
  chk_judicial_ok boolean DEFAULT false,
  checklist_notes text,
  effective_discharge_date date,
  service_package_description text,
  demand_origin_description text,
  official_letter_number text,
  contract_status_reason text,
  admin_notes text,
  cost_center_id text,
  erp_case_code text,
  contract_category contract_category_enum,
  acquisition_channel text,
  payer_admin_contact_id uuid,
  primary_payer_description text,
  scale_model scale_model_enum,
  shift_modality shift_modality_enum,
  base_professional_category text CHECK (CHECK ((base_professional_category = ANY (ARRAY['Medico'::text, 'Enfermeiro'::text, 'TecEnf'::text, 'Fisio'::text, 'Fono'::text, 'Nutri'::text, 'Psicologo'::text, 'Terapeuta'::text, 'Cuidador'::text])) OR base_professional_category IS NULL)),
  quantity_per_shift integer DEFAULT 1,
  weekly_hours_expected numeric,
  day_shift_start time without time zone,
  night_shift_start time without time zone,
  includes_weekends boolean DEFAULT true,
  holiday_rule text,
  auto_generate_scale boolean DEFAULT false,
  chk_address_proof_ok boolean DEFAULT false,
  chk_legal_guardian_docs_ok boolean DEFAULT false,
  chk_financial_responsible_docs_ok boolean DEFAULT false,
  checklist_complete boolean DEFAULT false,
  checklist_notes_detailed text,
  service_package_name text,
  contract_status_enum text CHECK (CHECK ((contract_status_enum = ANY (ARRAY['Proposta'::text, 'Em_Implantacao'::text, 'Ativo'::text, 'Suspenso'::text, 'Encerrado'::text, 'Cancelado'::text, 'Recusado'::text])) OR contract_status_enum IS NULL)),
  primary_payer_related_person_id uuid,
  primary_payer_legal_entity_id uuid,
  chk_address_proof_at timestamp with time zone,
  chk_address_proof_by uuid REFERENCES auth.users(id),
  chk_legal_guardian_docs_at timestamp with time zone,
  chk_legal_guardian_docs_by uuid REFERENCES auth.users(id),
  chk_financial_responsible_docs_at timestamp with time zone,
  chk_financial_responsible_docs_by uuid REFERENCES auth.users(id),
  chk_other_docs_ok boolean DEFAULT false,
  chk_other_docs_desc text,
  chk_other_docs_at timestamp with time zone,
  chk_other_docs_by uuid REFERENCES auth.users(id),
  day_shift_end time without time zone,
  night_shift_end time without time zone,
  reference_location_id uuid,
  chk_contract_doc_id uuid,
  chk_consent_doc_id uuid,
  chk_medical_report_doc_id uuid,
  chk_address_proof_doc_id uuid,
  chk_legal_docs_doc_id uuid,
  chk_financial_docs_doc_id uuid,
  chk_judicial_doc_id uuid,
  payer_admin_contact_description text,
  chk_judicial_at timestamp with time zone,
  chk_judicial_by uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_patient_admin_info_contract_id ON public.patient_admin_info (contract_id);
CREATE INDEX idx_patient_admin_info_contract_status_enum ON public.patient_admin_info (contract_status_enum);
CREATE INDEX idx_patient_admin_info_patient_id ON public.patient_admin_info (patient_id);
CREATE INDEX idx_patient_admin_info_primary_payer_related_person_id ON public.patient_admin_info (primary_payer_related_person_id);

CREATE TABLE public.patient_administrative_profiles (
  patient_id uuid PRIMARY KEY,
  admission_date date DEFAULT CURRENT_DATE,
  discharge_prediction_date date,
  discharge_date date,
  admission_type text CHECK (CHECK (admission_type = ANY (ARRAY['home_care'::text, 'paliativo'::text, 'procedimento_pontual'::text, 'reabilitacao'::text]))),
  service_package_name text,
  contract_number text,
  contract_status text CHECK (CHECK (contract_status = ANY (ARRAY['active'::text, 'suspended'::text, 'expired'::text, 'negotiating'::text]))) DEFAULT ''active'::text',
  technical_supervisor_name text,
  administrative_contact_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  allergen text NOT NULL,
  reaction text,
  severity text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_assigned_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  serial_number text,
  asset_tag text,
  assigned_at date DEFAULT CURRENT_DATE,
  status text DEFAULT ''Em Uso'::text',
  location_in_home text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_related_asset_id_fkey FOREIGN KEY (related_asset_id) REFERENCES public.patient_assigned_assets(id);

CREATE TABLE public.patient_civil_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  doc_type text NOT NULL CHECK (CHECK (doc_type = ANY (ARRAY['Passaporte'::text, 'RNE'::text, 'CNH'::text, 'Outro'::text]))),
  doc_number text NOT NULL,
  issuer text,
  issued_at date,
  valid_until date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  issuer_country text DEFAULT ''Brasil'::text'
);
CREATE INDEX idx_civil_docs_patient ON public.patient_civil_documents (patient_id);

CREATE TABLE public.patient_clinical_profiles (
  patient_id uuid PRIMARY KEY,
  complexity_level text CHECK (CHECK (complexity_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
  clinical_tags text[],
  diagnosis_main text,
  allergies text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  diagnosis_secondary text[],
  risk_braden integer DEFAULT 0,
  risk_morse integer DEFAULT 0,
  fall_risk text CHECK (CHECK (fall_risk = ANY (ARRAY['Baixo'::text, 'Moderado'::text, 'Alto'::text]))),
  oxygen_usage boolean DEFAULT false,
  oxygen_flow text,
  oxygen_equipment text,
  clinical_summary_note text
);

CREATE TABLE public.patient_clinical_summaries (
  patient_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  summary jsonb DEFAULT '{}'::jsonb,
  meta jsonb DEFAULT '{}'::jsonb,
  primary_diagnosis_cid text,
  primary_diagnosis_description text,
  complexity_level complexity_level DEFAULT 'Media'::complexity_level,
  clinical_summary_text text,
  blood_type text,
  updated_at timestamp with time zone DEFAULT now(),
  last_clinical_update_at timestamp with time zone DEFAULT now(),
  reference_professional_id uuid
);

CREATE TABLE public.patient_consumables_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  current_quantity numeric NOT NULL DEFAULT 0,
  min_quantity_threshold numeric DEFAULT 0,
  avg_daily_consumption numeric,
  last_replenishment_at date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (patient_id, item_id)
);

CREATE TABLE public.patient_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  device_type text NOT NULL,
  description text,
  installed_at date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_document_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  happened_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  title text NOT NULL,
  category text NOT NULL CHECK (CHECK (category = ANY (ARRAY['identity'::text, 'legal'::text, 'financial'::text, 'clinical'::text, 'consent'::text, 'other'::text]))),
  description text,
  tags text[],
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid REFERENCES auth.users(id),
  expires_at date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  domain_type doc_domain DEFAULT 'Administrativo'::doc_domain,
  subcategory text,
  source_module doc_source DEFAULT 'Ficha'::doc_source,
  file_name_original text,
  file_extension text,
  file_hash text,
  version integer DEFAULT 1,
  contract_id text,
  financial_record_id uuid,
  clinical_event_id uuid,
  is_visible_clinical boolean DEFAULT true,
  is_visible_admin boolean DEFAULT true,
  is_confidential boolean DEFAULT false,
  min_role_level text,
  status doc_status DEFAULT 'Ativo'::doc_status,
  last_updated_by uuid REFERENCES auth.users(id),
  last_updated_at timestamp with time zone DEFAULT now(),
  internal_notes text,
  external_ref text,
  storage_provider storage_provider_enum DEFAULT 'Supabase'::storage_provider_enum,
  storage_path text,
  original_file_name text,
  previous_document_id uuid REFERENCES public.patient_documents(id),
  origin_module doc_origin_enum DEFAULT 'Ficha_Documentos'::doc_origin_enum,
  admin_contract_id text,
  finance_entry_id uuid REFERENCES public.financial_ledger_entries(id),
  clinical_visit_id uuid,
  clinical_evolution_id uuid,
  prescription_id uuid,
  related_object_id uuid,
  clinical_visible boolean DEFAULT true,
  admin_fin_visible boolean DEFAULT true,
  min_access_role text DEFAULT ''Basico'::text',
  document_status doc_status_enum DEFAULT 'Ativo'::doc_status_enum,
  uploaded_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id),
  signature_type signature_type_enum DEFAULT 'Nenhuma'::signature_type_enum,
  signature_date timestamp with time zone,
  signature_summary text,
  external_signature_id text,
  public_notes text,
  signed_at timestamp with time zone,
  signers_summary text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  extension text,
  tenant_id uuid
);
CREATE INDEX idx_docs_category ON public.patient_documents (category);
CREATE INDEX idx_docs_created ON public.patient_documents (created_at);
CREATE INDEX idx_docs_domain ON public.patient_documents (domain_type);
CREATE INDEX idx_docs_origin ON public.patient_documents (origin_module);
CREATE INDEX idx_docs_status ON public.patient_documents (document_status);
CREATE INDEX idx_patient_documents_patient_cat_dom ON public.patient_documents (patient_id, category, domain_type);
CREATE INDEX idx_patient_documents_patient_created_at ON public.patient_documents (patient_id, created_at);
CREATE INDEX idx_patient_documents_patient_status ON public.patient_documents (patient_id, status);
CREATE INDEX idx_patient_documents_tags_gin ON public.patient_documents (tags);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_address_proof_doc_id_fkey FOREIGN KEY (chk_address_proof_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_consent_doc_id_fkey FOREIGN KEY (chk_consent_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_contract_doc_id_fkey FOREIGN KEY (chk_contract_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_financial_docs_doc_id_fkey FOREIGN KEY (chk_financial_docs_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_judicial_doc_id_fkey FOREIGN KEY (chk_judicial_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_legal_docs_doc_id_fkey FOREIGN KEY (chk_legal_docs_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_chk_medical_report_doc_id_fkey FOREIGN KEY (chk_medical_report_doc_id) REFERENCES public.patient_documents(id);
ALTER TABLE public.patient_document_logs ADD CONSTRAINT patient_document_logs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.patient_documents(id);

CREATE TABLE public.patient_domiciles (
  patient_id uuid PRIMARY KEY,
  ambulance_access text,
  team_parking text,
  night_access_risk text CHECK (CHECK (night_access_risk = ANY (ARRAY['Baixo'::text, 'Médio'::text, 'Alto'::text]))) DEFAULT ''Baixo'::text',
  gate_identification text,
  entry_procedure text,
  ventilation text,
  lighting_quality text,
  noise_level text,
  bed_type text,
  mattress_type text,
  voltage text,
  backup_power_source text,
  has_wifi boolean DEFAULT false,
  water_source text,
  has_smokers boolean DEFAULT false,
  hygiene_conditions text DEFAULT ''Boa'::text',
  pets_description text,
  animals_behavior text,
  general_observations text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_financial_profiles (
  patient_id uuid PRIMARY KEY,
  bond_type text CHECK (CHECK (bond_type = ANY (ARRAY['Plano de Saúde'::text, 'Particular'::text, 'Convênio'::text, 'Público'::text]))),
  insurer_name text,
  plan_name text,
  insurance_card_number text,
  insurance_card_validity date,
  monthly_fee numeric(10,2) DEFAULT 0,
  billing_due_day integer CHECK (CHECK (billing_due_day >= 1 AND billing_due_day <= 31)),
  payment_method text CHECK (CHECK ((payment_method = ANY (ARRAY['Boleto'::text, 'Pix'::text, 'Transferencia'::text, 'Debito_Automatico'::text, 'Cartao_Credito'::text, 'Dinheiro'::text, 'Outro'::text])) OR payment_method IS NULL)),
  financial_responsible_name text,
  financial_responsible_contact text,
  billing_status text CHECK (CHECK (billing_status = ANY (ARRAY['active'::text, 'suspended'::text, 'defaulting'::text]))) DEFAULT ''active'::text',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  card_holder_name text,
  grace_period_days integer DEFAULT 0,
  payment_terms text,
  billing_model text CHECK (CHECK ((billing_model = ANY (ARRAY['Mensalidade'::text, 'Diaria'::text, 'Plantao_12h'::text, 'Plantao_24h'::text, 'Visita'::text, 'Pacote_Fechado'::text, 'Outro'::text])) OR billing_model IS NULL)),
  billing_base_value numeric,
  billing_periodicity text,
  copay_percent numeric,
  readjustment_index text,
  readjustment_month integer,
  late_fee_percent numeric DEFAULT 0,
  daily_interest_percent numeric DEFAULT 0,
  discount_early_payment numeric DEFAULT 0,
  discount_days_limit integer,
  payer_relation text,
  billing_email_list text,
  billing_phone text,
  invoice_delivery_method text CHECK (CHECK ((invoice_delivery_method = ANY (ARRAY['Email'::text, 'Portal'::text, 'WhatsApp'::text, 'Correio'::text, 'Nao_Envia'::text])) OR invoice_delivery_method IS NULL)),
  tenant_id uuid,
  payer_type text,
  payer_name text,
  payer_doc_type text,
  payer_doc_number text,
  billing_cep text,
  billing_street text,
  billing_number text,
  billing_neighborhood text,
  billing_city text,
  billing_state text,
  due_day integer,
  responsible_related_person_id uuid,
  receiving_account_info text
);

CREATE TABLE public.patient_household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  type text NOT NULL CHECK (CHECK (type = ANY (ARRAY['resident'::text, 'caregiver'::text]))),
  schedule_note text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  current_quantity integer NOT NULL CHECK (CHECK (current_quantity >= 0)) DEFAULT 0,
  location_note text,
  serial_number text,
  installed_at timestamp with time zone DEFAULT now(),
  status text CHECK (CHECK (status = ANY (ARRAY['active'::text, 'returned'::text, 'maintenance'::text, 'consumed'::text]))) DEFAULT ''active'::text',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (patient_id, item_id, serial_number)
);

CREATE TABLE public.patient_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  route text,
  is_critical boolean DEFAULT false,
  status text CHECK (CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'discontinued'::text]))) DEFAULT ''active'::text',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_oxygen_therapy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  is_active boolean DEFAULT false,
  flow_rate_liters numeric,
  delivery_interface oxygen_delivery,
  source_mode oxygen_mode,
  usage_regime text,
  started_at date,
  notes text,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_related_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  relationship_degree text,
  role_type relatedness_role DEFAULT 'Familiar'::relatedness_role,
  is_legal_guardian boolean DEFAULT false,
  is_financial_responsible boolean DEFAULT false,
  is_emergency_contact boolean DEFAULT false,
  lives_with_patient text CHECK (CHECK ((lives_with_patient = ANY (ARRAY['Sim'::text, 'Nao'::text, 'VisitaFrequente'::text, 'VisitaEventual'::text])) OR lives_with_patient IS NULL)) DEFAULT 'false',
  visit_frequency text,
  access_to_home boolean DEFAULT false,
  can_authorize_clinical boolean DEFAULT false,
  can_authorize_financial boolean DEFAULT false,
  phone_primary text,
  phone_secondary text,
  email text,
  contact_time_preference text CHECK (CHECK ((contact_time_preference = ANY (ARRAY['Manha'::text, 'Tarde'::text, 'Noite'::text, 'QualquerHorario'::text])) OR contact_time_preference IS NULL)),
  priority_order integer DEFAULT 99,
  cpf text,
  rg text,
  address_full text,
  allow_clinical_updates boolean DEFAULT true,
  allow_admin_notif boolean DEFAULT true,
  block_marketing boolean DEFAULT false,
  observations text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_whatsapp boolean DEFAULT false,
  birth_date date,
  rg_issuer text,
  rg_state text,
  address_street text,
  address_number text,
  address_city text,
  address_state text,
  contact_type text NOT NULL CHECK (CHECK ((contact_type = ANY (ARRAY['ResponsavelLegal'::text, 'ResponsavelFinanceiro'::text, 'ContatoEmergencia24h'::text, 'Familiar'::text, 'Cuidador'::text, 'Vizinho'::text, 'Sindico'::text, 'Zelador'::text, 'Amigo'::text, 'Outro'::text])) OR contact_type IS NULL)),
  is_main_contact boolean DEFAULT false,
  relation_description text,
  preferred_contact text CHECK (CHECK ((preferred_contact = ANY (ARRAY['whatsapp'::text, 'phone'::text, 'sms'::text, 'email'::text, 'other'::text])) OR preferred_contact IS NULL)),
  address_summary text,
  observacoes_lgpd text
);
CREATE INDEX idx_patient_related_persons_patient_guardian_priority_created ON public.patient_related_persons (patient_id, is_legal_guardian, priority_order, created_at);
CREATE INDEX idx_patient_related_persons_patient_id ON public.patient_related_persons (patient_id);
CREATE INDEX idx_related_guardian ON public.patient_related_persons (patient_id, is_legal_guardian);
CREATE INDEX idx_related_patient ON public.patient_related_persons (patient_id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT fk_payer_admin_contact FOREIGN KEY (payer_admin_contact_id) REFERENCES public.patient_related_persons(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT fk_primary_payer_person FOREIGN KEY (primary_payer_related_person_id) REFERENCES public.patient_related_persons(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_payer_admin_contact_id_fkey FOREIGN KEY (payer_admin_contact_id) REFERENCES public.patient_related_persons(id);
ALTER TABLE public.patient_financial_profiles ADD CONSTRAINT patient_financial_profiles_responsible_related_person_id_fkey FOREIGN KEY (responsible_related_person_id) REFERENCES public.patient_related_persons(id);

CREATE TABLE public.patient_risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  scale_name text NOT NULL,
  score_value integer NOT NULL,
  risk_level risk_level,
  assessed_at timestamp with time zone DEFAULT now(),
  assessed_by uuid REFERENCES auth.users(id),
  notes text
);

CREATE TABLE public.patient_schedule_settings (
  patient_id uuid PRIMARY KEY,
  scheme_type text CHECK (CHECK (scheme_type = ANY (ARRAY['12x36'::text, '24x48'::text, 'daily_12h'::text, 'daily_24h'::text, 'custom'::text]))) DEFAULT ''12x36'::text',
  day_start_time time without time zone DEFAULT '07:00:00'::time without time zone,
  night_start_time time without time zone DEFAULT '19:00:00'::time without time zone,
  professionals_per_shift integer DEFAULT 1,
  required_role text CHECK (CHECK (required_role = ANY (ARRAY['caregiver'::text, 'technician'::text, 'nurse'::text]))) DEFAULT ''technician'::text',
  auto_generate boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patient_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id),
  service_name text NOT NULL,
  service_code text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  frequency text,
  authorized_quantity integer,
  valid_from date,
  valid_until date,
  status text DEFAULT ''active'::text',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  full_name text NOT NULL,
  cpf text UNIQUE CHECK (CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'::text)),
  date_of_birth date,
  gender text,
  primary_contractor_id uuid REFERENCES public.contractors(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mother_name text,
  social_name text,
  gender_identity text CHECK (CHECK (gender_identity = ANY (ARRAY['Cisgenero'::text, 'Transgenero'::text, 'Nao Binario'::text, 'Outro'::text, 'Prefiro nao informar'::text]))),
  civil_status text,
  nationality text DEFAULT ''Brasileira'::text',
  place_of_birth text,
  preferred_language text DEFAULT ''Português'::text',
  rg text,
  rg_issuer text,
  cns text,
  communication_preferences jsonb DEFAULT '{"sms": true, "email": true, "whatsapp": true}'::jsonb,
  salutation text,
  pronouns text CHECK (CHECK (pronouns = ANY (ARRAY['Ele/Dele'::text, 'Ela/Dela'::text, 'Elu/Delu'::text, 'Outro'::text]))),
  photo_consent boolean DEFAULT false,
  cpf_status text CHECK (CHECK (cpf_status = ANY (ARRAY['valid'::text, 'invalid'::text, 'unknown'::text]))) DEFAULT ''valid'::text',
  national_id text,
  document_validation_method text,
  external_ids jsonb,
  mobile_phone text,
  mobile_phone_verified boolean DEFAULT false,
  secondary_phone text,
  secondary_phone_type text,
  email text,
  email_verified boolean DEFAULT false,
  pref_contact_method text CHECK (CHECK (pref_contact_method = ANY (ARRAY['whatsapp'::text, 'phone'::text, 'email'::text]))),
  accept_sms boolean DEFAULT true,
  accept_email boolean DEFAULT true,
  block_marketing boolean DEFAULT false,
  record_status text CHECK (CHECK (record_status = ANY (ARRAY['draft'::text, 'onboarding'::text, 'active'::text, 'inactive'::text, 'deceased'::text, 'discharged'::text, 'pending_financial'::text]))) DEFAULT ''active'::text',
  onboarding_step integer DEFAULT 1,
  nickname text,
  education_level text CHECK (CHECK (education_level = ANY (ARRAY['Nao Alfabetizado'::text, 'Fundamental Incompleto'::text, 'Fundamental Completo'::text, 'Medio Incompleto'::text, 'Medio Completo'::text, 'Superior Incompleto'::text, 'Superior Completo'::text, 'Pos Graduacao'::text, 'Mestrado/Doutorado'::text, 'Nao Informado'::text]))),
  profession text,
  race_color text CHECK (CHECK (race_color = ANY (ARRAY['Branca'::text, 'Preta'::text, 'Parda'::text, 'Amarela'::text, 'Indigena'::text, 'Nao declarado'::text]))),
  is_pcd boolean DEFAULT false,
  place_of_birth_city text,
  place_of_birth_state text,
  place_of_birth_country text DEFAULT ''Brasil'::text',
  rg_issuer_state text CHECK (CHECK (rg_issuer_state ~* '^[A-Z]{2}$'::text)),
  rg_issued_at date,
  doc_validation_status text CHECK (CHECK (doc_validation_status = ANY (ARRAY['Nao Validado'::text, 'Validado'::text, 'Inconsistente'::text, 'Em Analise'::text]))) DEFAULT ''Pendente'::text',
  doc_validated_at timestamp with time zone,
  doc_validated_by uuid REFERENCES auth.users(id),
  doc_validation_method text,
  contact_time_preference text CHECK (CHECK (contact_time_preference = ANY (ARRAY['Manha'::text, 'Tarde'::text, 'Noite'::text, 'Comercial'::text, 'Qualquer Horario'::text]))),
  contact_notes text,
  marketing_consented_at timestamp with time zone,
  marketing_consent_source text CHECK (CHECK ((marketing_consent_source = ANY (ARRAY['Portal Administrativo (Edicao Manual)'::text, 'Formulario Web'::text, 'Assinatura Digital'::text, 'Importacao de Legado'::text, 'Solicitacao Verbal'::text])) OR marketing_consent_source IS NULL)),
  marketing_consent_ip inet,
  father_name text,
  photo_consent_date timestamp with time zone,
  doc_validation_source text,
  marketing_consent_status text CHECK (CHECK (marketing_consent_status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))) DEFAULT ''pending'::text',
  marketing_consent_history text,
  has_legal_guardian boolean DEFAULT false,
  legal_guardian_status text CHECK (CHECK (legal_guardian_status = ANY (ARRAY['Nao possui'::text, 'Cadastro Pendente'::text, 'Cadastro OK'::text]))) DEFAULT ''Nao possui'::text',
  UNIQUE (cpf, tenant_id)
);
ALTER TABLE public.care_team_members ADD CONSTRAINT care_team_members_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.financial_ledger_entries ADD CONSTRAINT financial_ledger_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.financial_records ADD CONSTRAINT financial_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_addresses ADD CONSTRAINT patient_addresses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_administrative_profiles ADD CONSTRAINT patient_administrative_profiles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_allergies ADD CONSTRAINT patient_allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_assigned_assets ADD CONSTRAINT patient_assigned_assets_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_civil_documents ADD CONSTRAINT patient_civil_documents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_clinical_profiles ADD CONSTRAINT patient_clinical_profiles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_clinical_summaries ADD CONSTRAINT patient_clinical_summaries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_consumables_stock ADD CONSTRAINT patient_consumables_stock_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_devices ADD CONSTRAINT patient_devices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_documents ADD CONSTRAINT patient_documents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_domiciles ADD CONSTRAINT patient_domiciles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_financial_profiles ADD CONSTRAINT patient_financial_profiles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_household_members ADD CONSTRAINT patient_household_members_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_inventory ADD CONSTRAINT patient_inventory_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_medications ADD CONSTRAINT patient_medications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_oxygen_therapy ADD CONSTRAINT patient_oxygen_therapy_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_related_persons ADD CONSTRAINT patient_related_persons_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_risk_scores ADD CONSTRAINT patient_risk_scores_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_schedule_settings ADD CONSTRAINT patient_schedule_settings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);
ALTER TABLE public.patient_services ADD CONSTRAINT patient_services_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);

CREATE TABLE public.professional_profiles (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  social_name text,
  cpf text,
  email text,
  contact_phone text,
  role text NOT NULL CHECK (CHECK (role = ANY (ARRAY['nurse'::text, 'technician'::text, 'caregiver'::text, 'physio'::text, 'medic'::text, 'coordinator'::text]))),
  professional_license text,
  bond_type text CHECK (CHECK (bond_type = ANY (ARRAY['clt'::text, 'pj'::text, 'cooperative'::text, 'freelancer'::text]))),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pix_key text,
  pix_key_type text,
  bank_account_info jsonb,
  payment_provider_id text
);
CREATE INDEX idx_professionals_name ON public.professional_profiles (full_name);
CREATE INDEX idx_professionals_role ON public.professional_profiles (role);

CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  full_name text NOT NULL,
  registry_code text,
  specialties text[] DEFAULT 'ARRAY[]::text[]',
  phone text,
  email text,
  avatar_url text,
  notes text,
  employment_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.care_team_members ADD CONSTRAINT care_team_members_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id);
ALTER TABLE public.patient_clinical_summaries ADD CONSTRAINT patient_clinical_summaries_reference_professional_id_fkey FOREIGN KEY (reference_professional_id) REFERENCES public.professionals(id);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  category text CHECK (CHECK (category = ANY (ARRAY['shift'::text, 'visit'::text, 'procedure'::text, 'equipment'::text, 'other'::text]))),
  default_duration_minutes integer,
  unit_measure text DEFAULT ''unidade'::text',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.shift_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id),
  status text CHECK (CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))) DEFAULT ''pending'::text',
  bid_amount numeric(10,2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (shift_id, professional_id)
);
CREATE INDEX idx_shift_candidates_shift ON public.shift_candidates (shift_id);

CREATE TABLE public.shift_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL,
  opened_by uuid REFERENCES auth.users(id),
  reason_category text NOT NULL,
  description text NOT NULL,
  status text CHECK (CHECK (status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved_paid'::text, 'resolved_refunded'::text]))) DEFAULT ''open'::text',
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

CREATE TABLE public.shift_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL,
  message text NOT NULL,
  author_name text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.shift_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL,
  event_time timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  icon_name text,
  tone text CHECK (CHECK (tone = ANY (ARRAY['default'::text, 'success'::text, 'warning'::text, 'critical'::text]))) DEFAULT ''default'::text',
  metadata jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_shift_timeline_order ON public.shift_timeline_events (shift_id, event_time);

CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT app_private.current_tenant_id(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  professional_id uuid REFERENCES public.professional_profiles(user_id),
  service_id uuid NOT NULL REFERENCES public.patient_services(id),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT (EXTRACT(epoch FROM (end_time - start_time)) / (60)::numeric),
  status text NOT NULL CHECK (CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'canceled'::text, 'missed'::text]))) DEFAULT ''scheduled'::text',
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  gps_lat double precision,
  gps_lng double precision,
  billing_batch_id uuid REFERENCES public.billing_batches(id),
  is_billable boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  shift_type text CHECK (CHECK (shift_type = ANY (ARRAY['day'::text, 'night'::text, '24h'::text]))) DEFAULT ''day'::text',
  caution_note text,
  candidate_count integer DEFAULT 0,
  is_critical boolean DEFAULT false,
  location_type text CHECK (CHECK (location_type = ANY (ARRAY['home'::text, 'hospital'::text, 'school'::text, 'other'::text]))) DEFAULT ''home'::text',
  location_notes text,
  contractor_id uuid REFERENCES public.contractors(id),
  financial_status text CHECK (CHECK (financial_status = ANY (ARRAY['pending'::text, 'authorized'::text, 'paid'::text, 'disputed'::text, 'canceled'::text]))) DEFAULT ''pending'::text',
  payout_value numeric(10,2),
  payout_transaction_id text
);
CREATE INDEX idx_shifts_billing ON public.shifts (billing_batch_id);
CREATE INDEX idx_shifts_dashboard_filter ON public.shifts (start_time, end_time, shift_type);
CREATE INDEX idx_shifts_quota_check ON public.shifts (patient_id, service_id, status);
CREATE INDEX idx_shifts_timeline ON public.shifts (start_time, end_time);
COMMENT ON COLUMN public.shifts.professional_id IS 'Link para public.professional_profiles(user_id)';
ALTER TABLE public.shift_candidates ADD CONSTRAINT shift_candidates_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id);
ALTER TABLE public.shift_disputes ADD CONSTRAINT shift_disputes_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id);
ALTER TABLE public.shift_internal_notes ADD CONSTRAINT shift_internal_notes_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id);
ALTER TABLE public.shift_timeline_events ADD CONSTRAINT shift_timeline_events_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id);

CREATE TABLE public.system_audit_errors (
  id integer PRIMARY KEY DEFAULT nextval('system_audit_errors_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  context text,
  payload jsonb,
  err text
);

CREATE TABLE public.system_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  action audit_action_type NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  changes jsonb,
  reason text,
  route_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_patient_id uuid
);
CREATE INDEX idx_audit_actor ON public.system_audit_logs (actor_id);
CREATE INDEX idx_audit_created_at ON public.system_audit_logs (created_at);
CREATE INDEX idx_audit_entity ON public.system_audit_logs (entity_table, entity_id);
CREATE INDEX idx_audit_logs_actor_id ON public.system_audit_logs (actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.system_audit_logs (created_at);
CREATE INDEX idx_audit_logs_entity_table ON public.system_audit_logs (entity_table);
CREATE INDEX idx_audit_parent_patient ON public.system_audit_logs (parent_patient_id);

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.care_team_members ADD CONSTRAINT care_team_members_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.financial_ledger_entries ADD CONSTRAINT financial_ledger_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_allergies ADD CONSTRAINT patient_allergies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_assigned_assets ADD CONSTRAINT patient_assigned_assets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_civil_documents ADD CONSTRAINT patient_civil_documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_clinical_summaries ADD CONSTRAINT patient_clinical_summaries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_consumables_stock ADD CONSTRAINT patient_consumables_stock_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_devices ADD CONSTRAINT patient_devices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_document_logs ADD CONSTRAINT patient_document_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_documents ADD CONSTRAINT patient_documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_financial_profiles ADD CONSTRAINT patient_financial_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_oxygen_therapy ADD CONSTRAINT patient_oxygen_therapy_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_related_persons ADD CONSTRAINT patient_related_persons_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.patient_risk_scores ADD CONSTRAINT patient_risk_scores_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
ALTER TABLE public.professionals ADD CONSTRAINT professionals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  email text UNIQUE,
  name text,
  phone text,
  role text DEFAULT ''viewer'::text',
  tenant_id uuid REFERENCES public.tenants(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_commercial_responsible_id_fkey FOREIGN KEY (commercial_responsible_id) REFERENCES public.user_profiles(auth_user_id);
ALTER TABLE public.patient_admin_info ADD CONSTRAINT patient_admin_info_contract_manager_id_fkey FOREIGN KEY (contract_manager_id) REFERENCES public.user_profiles(auth_user_id);
ALTER TABLE public.care_team_members ADD CONSTRAINT care_team_members_user_profile_id_fkey FOREIGN KEY (user_profile_id) REFERENCES public.user_profiles(id);

CREATE TABLE public.view_patient_legal_guardian_summary (
  patient_id uuid,
  related_person_id uuid,
  responsavellegalnome text,
  responsavellegalparentesco text,
  responsavellegaltelefoneprincipal text,
  hasresponsavellegal boolean
);

CREATE TABLE realtime.schema_migrations (
  version bigint PRIMARY KEY,
  inserted_at timestamp(0) without time zone
);

CREATE TABLE realtime.subscription (
  id bigint PRIMARY KEY,
  subscription_id uuid NOT NULL,
  entity regclass NOT NULL,
  filters realtime.user_defined_filter[] NOT NULL DEFAULT '{}'::realtime.user_defined_filter[],
  claims jsonb NOT NULL,
  claims_role regrole NOT NULL DEFAULT realtime.to_regrole((claims ->> 'role'::text)),
  created_at timestamp without time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (subscription_id, entity, filters)
);
CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription (entity);

CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  owner uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  owner_id text,
  type storage.buckettype NOT NULL DEFAULT 'STANDARD'::storage.buckettype
);
COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';

CREATE TABLE storage.buckets_analytics (
  name text NOT NULL UNIQUE,
  type storage.buckettype NOT NULL DEFAULT 'ANALYTICS'::storage.buckettype,
  format text NOT NULL DEFAULT ''ICEBERG'::text',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_at timestamp with time zone
);

CREATE TABLE storage.buckets_vectors (
  id text PRIMARY KEY,
  type storage.buckettype NOT NULL DEFAULT 'VECTOR'::storage.buckettype,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE storage.migrations (
  id integer PRIMARY KEY,
  name character varying(100) NOT NULL UNIQUE,
  hash character varying(40) NOT NULL,
  executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  path_tokens text[] DEFAULT 'string_to_array(name, '/'::text)',
  version text,
  owner_id text,
  user_metadata jsonb,
  level integer,
  UNIQUE (bucket_id, name),
  UNIQUE (name, bucket_id, level),
  UNIQUE (bucket_id, level, name)
);
CREATE INDEX idx_objects_bucket_id_name ON storage.objects (bucket_id, name);
CREATE INDEX idx_objects_lower_name ON storage.objects (*expression*, *expression*, bucket_id, level);
CREATE INDEX name_prefix_search ON storage.objects (name);
COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';

CREATE TABLE storage.prefixes (
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  level integer DEFAULT storage.get_level(name),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (bucket_id, level, name)
);
CREATE INDEX idx_prefixes_lower_name ON storage.prefixes (bucket_id, level, *expression*, *expression*);

CREATE TABLE storage.s3_multipart_uploads (
  id text PRIMARY KEY,
  in_progress_size bigint NOT NULL DEFAULT 0,
  upload_signature text NOT NULL,
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  key text NOT NULL,
  version text NOT NULL,
  owner_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_metadata jsonb
);
CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads (bucket_id, key, created_at);

CREATE TABLE storage.s3_multipart_uploads_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id text NOT NULL REFERENCES storage.s3_multipart_uploads(id),
  size bigint NOT NULL DEFAULT 0,
  part_number integer NOT NULL,
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  key text NOT NULL,
  etag text NOT NULL,
  owner_id text,
  version text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE storage.vector_indexes (
  id text PRIMARY KEY DEFAULT 'gen_random_uuid()',
  name text NOT NULL,
  bucket_id text NOT NULL REFERENCES storage.buckets_vectors(id),
  data_type text NOT NULL,
  dimension integer NOT NULL,
  distance_metric text NOT NULL,
  metadata_configuration jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (name, bucket_id)
);

CREATE TABLE vault.decrypted_secrets (
  id uuid,
  name text,
  description text,
  secret text,
  decrypted_secret text,
  key_id uuid,
  nonce bytea,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

CREATE TABLE vault.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE,
  description text NOT NULL DEFAULT '''::text',
  secret text NOT NULL,
  key_id uuid,
  nonce bytea DEFAULT vault._crypto_aead_det_noncegen(),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE vault.secrets IS 'Table with encrypted `secret` column for storing sensitive information on disk.';
