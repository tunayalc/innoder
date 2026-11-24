ALTER TABLE programs ADD COLUMN program_kind text NOT NULL DEFAULT 'other'
  CHECK (program_kind IN ('other', 'esc'));
ALTER TABLE programs ADD COLUMN collect_blood_group boolean NOT NULL DEFAULT false;
ALTER TABLE programs ADD CONSTRAINT esc_blood_group_only
  CHECK (NOT collect_blood_group OR program_kind = 'esc');

CREATE TABLE application_blood_groups (
  application_id uuid PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  sealed_value text NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now()
);

-- Legacy profile entries have no project-specific consent. Never import them.
UPDATE users SET blood_group = NULL WHERE blood_group IS NOT NULL;
UPDATE applications SET personal_info = personal_info - 'bloodGroup'
WHERE personal_info ? 'bloodGroup';
