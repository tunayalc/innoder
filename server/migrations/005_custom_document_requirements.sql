-- Admins can ask for named documents beyond the fixed types. Such a document is
-- stored as an 'extra' upload tied to the checklist item's key, and only the
-- latest upload for a key is current.
ALTER TABLE documents ADD COLUMN requirement_key text
  CHECK (requirement_key IS NULL OR (type = 'extra' AND requirement_key ~ '^custom_[a-z0-9]{6,32}$'));
CREATE UNIQUE INDEX documents_current_requirement
  ON documents(application_id, requirement_key)
  WHERE is_current AND requirement_key IS NOT NULL;
