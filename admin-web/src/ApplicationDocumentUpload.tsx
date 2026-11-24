import { translate as tr } from './locale';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { api } from './api';
import { DOCUMENTS, UPLOADABLE_DOCUMENT_TYPES } from './domain';
import type { Application, Document } from './types';
import { errorMessage, Feedback } from './ui';
import { useLeaveWarning } from './workflows';
import { ScanPages } from './ScanPages';

const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export const ApplicationDocumentUpload = ({
  application,
  onUploaded,
  allowScan = false,
  allowedTypes,
}: {
  application: Application;
  onUploaded: (doc: Document) => void;
  allowScan?: boolean;
  allowedTypes?: string[];
}) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const key = useRef<string | undefined>(undefined);
  const request = useRef<AbortController | undefined>(undefined);
  useLeaveWarning(Boolean(file));
  useEffect(() => () => request.current?.abort(), []);
  const replaces =
    type !== 'extra' && application.documents.some(doc => doc.type === type);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (request.current || !type || !file) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setPercent(0);
    setError('');
    setSuccess('');
    try {
      key.current ??= crypto.randomUUID();
      const document = await api.uploadApplicationDocument(
        application.id,
        type,
        file,
        key.current,
        controller.signal,
        setPercent,
      );
      if (controller.signal.aborted) return;
      setFile(undefined);
      key.current = undefined;
      if (input.current) input.current.value = '';
      setOpen(false);
      setSuccess(tr('Belge başvuruya eklendi.'));
      onUploaded(document);
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorMessage(cause));
    } finally {
      request.current = undefined;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          className="secondary small"
          onClick={() => {
            setSuccess('');
            setOpen(true);
          }}
        >
          <Upload size={16} /> {tr('Belge ekle')}
        </button>
      )}
      <Feedback success={success} />
      {open && (
        <form
          className="action-form stack"
          aria-label={tr('Başvuruya belge ekle')}
          onSubmit={submit}
        >
          <label>
            {tr('Belge türü')}
            <select
              required
              value={type}
              disabled={busy}
              onChange={event => {
                setType(event.target.value);
                key.current = undefined;
              }}
            >
              <option value="">{tr('Belge türü seçin')}</option>
              {UPLOADABLE_DOCUMENT_TYPES.filter(
                kind => !allowedTypes || allowedTypes.includes(kind),
              ).map(kind => (
                <option key={kind} value={kind}>
                  {DOCUMENTS[kind]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr('Dosya (PDF, JPG, PNG · en fazla 20 MB)')}
            <input
              ref={input}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={busy}
              onChange={event => {
                const selected = event.target.files?.[0];
                key.current = undefined;
                setFile(undefined);
                setError('');
                if (!selected) return;
                const extension = selected.name
                  .match(/\.(pdf|jpe?g|png)$/i)?.[1]
                  ?.toLowerCase();
                const mime = extension && mimeByExtension[extension];
                if (
                  !mime ||
                  (selected.type && selected.type !== mime) ||
                  !selected.size ||
                  selected.size > 20 * 1024 * 1024
                ) {
                  event.target.value = '';
                  setError(
                    tr('20 MB’ı aşmayan geçerli bir PDF, JPG veya PNG seçin.'),
                  );
                  return;
                }
                setFile(
                  selected.type
                    ? selected
                    : new File([selected], selected.name, { type: mime }),
                );
              }}
            />
          </label>
          {allowScan && (
            <ScanPages
              disabled={busy}
              onFile={f => {
                if (input.current) input.current.value = '';
                setFile(f);
                key.current = undefined;
                setError('');
              }}
            />
          )}
          {file && (
            <small>
              {tr('Seçilen dosya:')} {file.name}
            </small>
          )}
          {replaces && (
            <p className="muted">
              {tr('Önceki dosya belge geçmişinde kalır.')}
            </p>
          )}
          <Feedback error={error} />
          {busy && (
            <label>
              {tr('Yükleniyor…')} {percent}%
              <progress max={100} value={percent} />
            </label>
          )}
          <div className="button-row">
            {busy && (
              <button
                type="button"
                className="secondary small"
                onClick={() => {
                  request.current?.abort();
                  setBusy(false);
                }}
              >
                {tr('Yüklemeyi durdur')}
              </button>
            )}
            <button
              type="button"
              className="secondary small"
              disabled={busy}
              onClick={() => {
                setFile(undefined);
                key.current = undefined;
                setError('');
                setOpen(false);
              }}
            >
              {tr('Vazgeç')}
            </button>
            <button className="primary small" disabled={busy || !type || !file}>
              {busy
                ? tr('Yükleniyor…')
                : replaces
                ? tr('Yeni sürümü yükle')
                : tr('Belgeyi yükle')}
            </button>
          </div>
        </form>
      )}
    </>
  );
};
