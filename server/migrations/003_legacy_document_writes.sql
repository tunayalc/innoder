-- Keep uploads functional if an older API image is temporarily restored.
CREATE FUNCTION prepare_document_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM applications WHERE id=NEW.application_id FOR UPDATE;
  SELECT COALESCE(max(version),0)+1 INTO NEW.version
    FROM documents WHERE application_id=NEW.application_id AND type=NEW.type;
  IF NEW.type <> 'extra' AND NEW.is_current THEN
    UPDATE documents SET is_current=false
      WHERE application_id=NEW.application_id AND type=NEW.type AND is_current;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER document_version_default BEFORE INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION prepare_document_version();
