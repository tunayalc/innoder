ALTER TABLE users ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE programs ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE applications ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE applications ADD COLUMN program_snapshot jsonb;
ALTER TABLE documents ADD COLUMN revision integer NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN is_current boolean NOT NULL DEFAULT true;
ALTER TABLE documents ADD COLUMN upload_key text;
ALTER TABLE documents ADD COLUMN content_hash text;

CREATE FUNCTION normalize_checklist(items jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_agg(item ORDER BY position, subposition), '[]'::jsonb)
  FROM (
    SELECT CASE WHEN entry->>'documentType' = 'boarding_pass'
      THEN entry || jsonb_build_object('id', COALESCE(entry->>'id', 'boarding') || '-' || direction,
        'documentType', 'boarding_pass_' || direction,
        'title', CASE WHEN direction = 'outbound' THEN 'Gidiş Biniş Kartı' ELSE 'Dönüş Biniş Kartı' END,
        'requiredStage', 'erasmus_stage')
      ELSE entry END AS item, position, subposition
    FROM jsonb_array_elements(items) WITH ORDINALITY AS entries(entry, position)
    CROSS JOIN LATERAL (
      SELECT 'outbound' AS direction, 1 AS subposition
      UNION ALL SELECT 'return', 2 WHERE entry->>'documentType' = 'boarding_pass'
    ) AS directions
  ) expanded;
$$;

UPDATE programs SET checklist = normalize_checklist(checklist);
UPDATE applications a SET program_snapshot = jsonb_build_object(
  'id', p.id, 'name', p.name, 'year', p.year, 'steps', p.steps, 'deadlines', p.deadlines,
  'checklist', p.checklist, 'commonMistakes', p.common_mistakes, 'revision', p.revision,
  'createdAt', p.created_at, 'updatedAt', p.updated_at, 'createdByUserId', p.created_by_user_id
) FROM programs p WHERE a.program_id = p.id;
ALTER TABLE applications ALTER COLUMN program_snapshot SET NOT NULL;
-- Support older API containers during a rolling migration/release.
CREATE FUNCTION fill_application_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_snapshot IS NULL THEN
    SELECT jsonb_build_object('id',p.id,'name',p.name,'year',p.year,'steps',p.steps,'deadlines',p.deadlines,
      'checklist',p.checklist,'commonMistakes',p.common_mistakes,'revision',p.revision,
      'createdAt',p.created_at,'updatedAt',p.updated_at,'createdByUserId',p.created_by_user_id)
      INTO NEW.program_snapshot FROM programs p WHERE p.id=NEW.program_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER application_snapshot_default BEFORE INSERT ON applications FOR EACH ROW EXECUTE FUNCTION fill_application_snapshot();

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY application_id, type ORDER BY uploaded_at, id) AS number,
    row_number() OVER (PARTITION BY application_id, type ORDER BY uploaded_at DESC, id DESC) AS latest
  FROM documents
) UPDATE documents d SET version = ranked.number, is_current = (d.type = 'extra' OR ranked.latest = 1)
FROM ranked WHERE d.id = ranked.id;
-- A historical boarding pass stays a single file. It never completes both new requirements.
CREATE UNIQUE INDEX documents_current_type ON documents(application_id, type) WHERE is_current AND type <> 'extra';
CREATE UNIQUE INDEX documents_upload_key ON documents(application_id, type, upload_key) WHERE upload_key IS NOT NULL;
CREATE INDEX documents_history ON documents(application_id, uploaded_at DESC);
CREATE INDEX applications_list ON applications(updated_at DESC, id);
CREATE INDEX messages_thread_date ON messages(thread_key, created_at DESC, id);

CREATE FUNCTION increment_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.revision = OLD.revision + 1; RETURN NEW; END;
$$;
CREATE TRIGGER users_revision BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION increment_revision();
CREATE TRIGGER programs_revision BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION increment_revision();
CREATE TRIGGER applications_revision BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION increment_revision();
CREATE TRIGGER documents_revision BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION increment_revision();

CREATE TABLE email_change_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
  new_email text NOT NULL, token_hash text UNIQUE NOT NULL, token_version integer NOT NULL,
  expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE file_cleanup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES account_deletion_requests(id),
  storage_path text NOT NULL, attempts integer NOT NULL DEFAULT 0, completed_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), last_error text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, storage_path)
);
CREATE TABLE program_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs(id),
  type text NOT NULL CHECK(type IN ('activity_agreement', 'commitment_letter')),
  file_name text NOT NULL, storage_path text NOT NULL, size_bytes integer NOT NULL, page_count integer NOT NULL,
  uploaded_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX current_program_template ON program_templates(program_id, type) WHERE is_current;
