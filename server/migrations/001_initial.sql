CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('candidate', 'admin', 'super_admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled', 'deletion_requested', 'anonymized')),
  password_hash text,
  must_change_password boolean NOT NULL DEFAULT false,
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  token_version integer NOT NULL DEFAULT 0,
  event_link text,
  phone text,
  country text,
  city text,
  birth_date date,
  nationality text,
  identity_type text CHECK (identity_type IS NULL OR identity_type IN ('turkish_id', 'passport')),
  identity_number text,
  passport_number text,
  pnr_number text,
  blood_group text,
  kvkk_accepted boolean NOT NULL DEFAULT false,
  consent_version text,
  consented_at timestamptz,
  notice_version text,
  notice_accepted_at timestamptz,
  credential_requested_at timestamptz,
  credential_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_identity_number_unique
  ON users(identity_number) WHERE identity_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_passport_number_unique
  ON users(passport_number) WHERE passport_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year integer NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  deadlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  common_mistakes jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, year)
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  program_id uuid NOT NULL REFERENCES programs(id),
  stage text NOT NULL DEFAULT 'application_stage' CHECK (stage IN ('application_stage', 'erasmus_stage', 'returned_home')),
  decision_status text NOT NULL DEFAULT 'active' CHECK (decision_status IN ('active', 'rejected')),
  decision_reason text,
  personal_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'identity', 'form', 'extra', 'agreement', 'activity_agreement',
    'commitment_letter', 'photo_activity_report', 'visa_payment_receipt_original',
    'boarding_pass', 'boarding_pass_outbound', 'boarding_pass_return'
  )),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20971520),
  page_count integer,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('ok', 'missing', 'wrong_format', 'unread')),
  verify_note text,
  verified_at timestamptz,
  verified_by_user_id uuid REFERENCES users(id),
  physical_delivery_status text NOT NULL DEFAULT 'not_required' CHECK (physical_delivery_status IN ('not_required', 'awaiting_original', 'delivered')),
  physical_delivered_at timestamptz,
  physical_delivered_by_user_id uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_application_id_idx ON documents(application_id);
CREATE INDEX IF NOT EXISTS applications_stage_idx ON applications(stage);
CREATE INDEX IF NOT EXISTS applications_user_id_idx ON applications(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  thread_key text NOT NULL,
  sender_id uuid NOT NULL REFERENCES users(id),
  sender_role text NOT NULL CHECK (sender_role IN ('candidate', 'admin')),
  content text NOT NULL,
  related_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  read_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_thread_key_idx ON messages(thread_key, created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid REFERENCES users(id)
);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_touch_updated_at ON users;
CREATE TRIGGER users_touch_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS programs_touch_updated_at ON programs;
CREATE TRIGGER programs_touch_updated_at BEFORE UPDATE ON programs
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS applications_touch_updated_at ON applications;
CREATE TRIGGER applications_touch_updated_at BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
