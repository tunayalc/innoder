import { translate as tr } from './locale';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Archive, Download, Edit3, Plus, Send, Trash2 } from 'lucide-react';
import { api } from './api';
import {
  documentLabel,
  DOCUMENTS,
  formatDate,
  newRequirementKey,
  UPLOADABLE_DOCUMENT_TYPES,
} from './domain';
import { useCollection } from './hooks';
import {
  EmptyState,
  errorMessage,
  Feedback,
  Modal,
  Person,
  SearchField,
} from './ui';
import type {
  ChecklistItem,
  DeletionRequest,
  Message,
  Program,
  User,
  ThreadSummary,
} from './types';

const emptyProgram = (): Partial<Program> => ({
  name: '',
  year: new Date().getFullYear(),
  steps: [],
  deadlines: [],
  checklist: [],
  commonMistakes: [],
  active: true,
});
export const confirmLeave = () =>
  window.dispatchEvent(new Event('inno:before-leave', { cancelable: true }));
export const useLeaveWarning = (dirty: boolean) =>
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const leave = (event: Event) => {
      if (
        dirty &&
        !window.confirm(tr('Kaydedilmemiş değişiklikler silinsin mi?'))
      )
        event.preventDefault();
    };
    window.addEventListener('inno:before-leave', leave);
    window.addEventListener('beforeunload', listener);
    return () => {
      window.removeEventListener('beforeunload', listener);
      window.removeEventListener('inno:before-leave', leave);
    };
  }, [dirty]);

export const ProgramsView = () => {
  const programs = useCollection(api.programs);
  const [editor, setEditor] = useState<Partial<Program>>();
  const [assignment, setAssignment] = useState<Program>();
  const [notice, setNotice] = useState(''),
    [error, setError] = useState('');
  return (
    <>
      <div className="list-heading">
        <h2>
          {tr('Programlar')}{' '}
          <span className="count">{programs.items.length}</span>
        </h2>
        <button className="primary" onClick={() => setEditor(emptyProgram())}>
          <Plus size={17} />
          {tr('Program oluştur')}
        </button>
      </div>
      <Feedback error={error || programs.error} success={notice} />
      {programs.loading ? (
        <EmptyState loading />
      ) : !programs.items.length ? (
        <EmptyState title={tr('Henüz program yok')} onRetry={programs.load} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tr('Program')}</th>
                <th>{tr('Yıl')}</th>
                <th>{tr('Belgeler')}</th>
                <th>{tr('Durum')}</th>
                <th>{tr('İşlemler')}</th>
              </tr>
            </thead>
            <tbody>
              {programs.items.map(program => (
                <tr key={program.id}>
                  <td>{program.name}</td>
                  <td>{program.year}</td>
                  <td>{program.checklist.length}</td>
                  <td>{program.active ? tr('Aktif') : tr('Arşiv')}</td>
                  <td>
                    <div className="button-row">
                      <button
                        className="icon-button"
                        title={tr('Programı düzenle')}
                        aria-label={`${program.name} ${tr('düzenle')}`}
                        onClick={() => setEditor(program)}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        className="secondary"
                        disabled={!program.active}
                        onClick={() => setAssignment(program)}
                      >
                        <Plus size={16} />
                        {tr('Aday ata')}
                      </button>
                      <button
                        className="icon-button"
                        title={
                          program.active ? tr('Arşivle') : tr('Etkinleştir')
                        }
                        aria-label={
                          program.active ? tr('Arşivle') : tr('Etkinleştir')
                        }
                        onClick={async () => {
                          setError('');
                          try {
                            await api.saveProgram(
                              {
                                active: !program.active,
                                revision: program.revision,
                              },
                              program.id,
                            );
                            await programs.load();
                          } catch (cause) {
                            setError(errorMessage(cause));
                          }
                        }}
                      >
                        <Archive size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editor && (
        <ProgramEditor
          initial={editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setNotice(
              tr(
                'Program kaydedildi. Mevcut başvuruların koşulları korunmuştur.',
              ),
            );
            void programs.load();
          }}
        />
      )}
      {assignment && (
        <AssignmentDialog
          program={assignment}
          onClose={() => setAssignment(undefined)}
        />
      )}
    </>
  );
};

const ProgramEditor = ({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Program>;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [draft, setDraft] = useState(initial),
    [steps, setSteps] = useState(initial.steps?.join('\n') || ''),
    [deadlines, setDeadlines] = useState(
      initial.deadlines
        ?.map(item => `${item.label}|${item.dateISO}`)
        .join('\n') || '',
    );
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  const templates = useCollection(
    useCallback(
      () => (initial.id ? api.templates(initial.id) : Promise.resolve([])),
      [initial.id],
    ),
  );
  useLeaveWarning(dirty);
  const close = () => {
    if (
      !dirty ||
      window.confirm(tr('Kaydedilmemiş değişiklikler silinsin mi?'))
    )
      onClose();
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const dates = deadlines
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const separator = line.indexOf('|');
          if (separator < 1)
            throw new Error(tr('Tarih satırı: Başlık|YYYY-MM-DD'));
          return {
            label: line.slice(0, separator).trim(),
            dateISO: line.slice(separator + 1).trim(),
          };
        });
      await api.saveProgram(
        {
          ...draft,
          steps: steps
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean),
          deadlines: dates,
        },
        initial.id,
      );
      setDirty(false);
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={initial.id ? tr('Programı düzenle') : tr('Program oluştur')}
      onClose={close}
      busy={busy}
    >
      <form
        className="dialog-body workflow-form"
        onSubmit={save}
        onChange={() => setDirty(true)}
      >
        <Feedback error={error} />
        <label>
          {tr('Program adı')}
          <input
            required
            maxLength={200}
            value={draft.name || ''}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label>
          {tr('Yıl')}
          <input
            required
            type="number"
            min="2020"
            max="2100"
            value={draft.year}
            onChange={e => setDraft({ ...draft, year: Number(e.target.value) })}
          />
        </label>
        <label>
          {tr('Program türü')}
          <select
            value={draft.programKind ?? 'other'}
            onChange={e => {
              const programKind = e.target.value === 'esc' ? 'esc' : 'other';
              setDraft({
                ...draft,
                programKind,
                collectBloodGroup:
                  programKind === 'esc' && Boolean(draft.collectBloodGroup),
              });
            }}
          >
            <option value="other">{tr('Diğer')}</option>
            <option value="esc">{tr('Avrupa Dayanışma Programı (ESC)')}</option>
          </select>
        </label>
        {draft.programKind === 'esc' && (
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.collectBloodGroup ?? false}
              onChange={e =>
                setDraft({ ...draft, collectBloodGroup: e.target.checked })
              }
            />
            {tr('İsteğe bağlı kan grubu paylaşımı')}
          </label>
        )}
        <label>
          {tr('Adımlar')}
          <textarea
            rows={3}
            value={steps}
            onChange={e => setSteps(e.target.value)}
          />
        </label>
        <label>
          {tr('Son tarihler')}
          <textarea
            rows={3}
            placeholder={tr('Belge teslimi|2026-12-31')}
            value={deadlines}
            onChange={e => setDeadlines(e.target.value)}
          />
        </label>
        <fieldset>
          <legend>{tr('Zorunlu belgeler')}</legend>
          {UPLOADABLE_DOCUMENT_TYPES.map(type => (
            <label className="checkbox-field" key={type}>
              <input
                type="checkbox"
                checked={
                  draft.checklist?.some(
                    item => item.documentType === type && !item.key,
                  ) || false
                }
                onChange={e =>
                  setDraft({
                    ...draft,
                    checklist: e.target.checked
                      ? [
                          ...(draft.checklist || []),
                          {
                            documentType: type,
                            expectedFormat: 'PDF / JPG / PNG',
                            requiredStage: [
                              'boarding_pass_outbound',
                              'boarding_pass_return',
                              'photo_activity_report',
                            ].includes(type)
                              ? 'erasmus_stage'
                              : 'application_stage',
                          },
                        ]
                      : (draft.checklist || []).filter(
                          item => item.documentType !== type || item.key,
                        ),
                  })
                }
              />
              {DOCUMENTS[type]}
            </label>
          ))}
        </fieldset>
        <CustomDocuments
          items={(draft.checklist || []).filter(item => item.key)}
          disabled={busy}
          onChange={custom => {
            setDirty(true);
            setDraft({
              ...draft,
              checklist: [
                ...(draft.checklist || []).filter(item => !item.key),
                ...custom,
              ],
            });
          }}
        />
        <button className="primary" disabled={busy || !draft.checklist?.length}>
          {busy ? tr('Kaydediliyor...') : tr('Programı kaydet')}
        </button>
        {initial.id && (
          <section className="detail-section">
            <h3>{tr('Kurum PDF şablonları')}</h3>
            {['activity_agreement', 'commitment_letter'].map(type => (
              <label key={type}>
                {DOCUMENTS[type]}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) {
                      setError(tr('Şablon en fazla 20 MB olabilir.'));
                      return;
                    }
                    setBusy(true);
                    setError('');
                    try {
                      await api.uploadTemplate(initial.id!, type, file);
                      await templates.load();
                    } catch (cause) {
                      setError(errorMessage(cause));
                    } finally {
                      setBusy(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            ))}
            {templates.items.map(item => (
              <button
                type="button"
                className="secondary"
                key={item.id}
                onClick={() =>
                  api
                    .downloadTemplate(item.id, item.fileName)
                    .catch(cause => setError(errorMessage(cause)))
                }
              >
                <Download size={16} />
                {item.fileName}
              </button>
            ))}
          </section>
        )}
      </form>
    </Modal>
  );
};

const AssignmentDialog = ({
  program,
  onClose,
}: {
  program: Program;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState(''),
    [chosen, setChosen] = useState(''),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [busy, setBusy] = useState(false);
  const candidates = useCollection(
    useCallback(
      async () =>
        (
          await api.candidatePage(
            new URLSearchParams({ page: '1', pageSize: '25', q: query }),
          )
        ).items,
      [query],
    ),
  );
  return (
    <Modal title={`${program.name}: aday atama`} onClose={onClose} busy={busy}>
      <div className="dialog-body workflow-form">
        <SearchField value={query} onChange={setQuery} />
        <Feedback error={error || candidates.error} success={success} />
        <label>
          {tr('Aday')}
          <select value={chosen} onChange={e => setChosen(e.target.value)}>
            <option value="">{tr('Aday seçin')}</option>
            {candidates.items.map(candidate => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} · {candidate.email}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={!chosen || busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            setSuccess('');
            try {
              await api.assignProgram(program.id, chosen);
              setSuccess(tr('Program adaya atandı.'));
              setChosen('');
            } catch (cause) {
              setError(errorMessage(cause));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Plus size={17} />
          {tr('Programı ata')}
        </button>
      </div>
    </Modal>
  );
};

export const ThreadView = ({
  threadId,
  onRead,
}: {
  threadId: string;
  onRead?: () => void;
}) => {
  const [items, setItems] = useState<Message[]>([]),
    [content, setContent] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [olderBusy, setOlderBusy] = useState(false),
    [pageNumber, setPageNumber] = useState(1),
    [total, setTotal] = useState(0);
  const sequence = useRef(0),
    sendLock = useRef(false);
  useLeaveWarning(Boolean(content));
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const page = await api.messages(threadId);
      if (request !== sequence.current) return;
      setItems(page.items);
      setPageNumber(1);
      setTotal(page.total);
      await api.readMessages(threadId);
      onRead?.();
    } catch (cause) {
      if (request === sequence.current) setError(errorMessage(cause));
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [threadId, onRead]);
  useEffect(() => {
    setContent('');
    void load();
    return () => {
      sequence.current++;
    };
  }, [load]);
  return (
    <section className="workflow-form">
      <Feedback error={error} />
      {error && (
        <button
          className="secondary"
          disabled={loading}
          onClick={() => void load()}
        >
          {tr('Tekrar dene')}
        </button>
      )}
      {!loading && items.length < total && (
        <button
          className="secondary"
          disabled={olderBusy}
          onClick={async () => {
            const request = sequence.current;
            setOlderBusy(true);
            setError('');
            try {
              const next = await api.messages(threadId, pageNumber + 1);
              if (request !== sequence.current) return;
              setItems(previous =>
                Array.from(
                  new Map(
                    [...next.items, ...previous].map(item => [item.id, item]),
                  ).values(),
                ),
              );
              setPageNumber(next.page);
              setTotal(next.total);
            } catch (cause) {
              if (request === sequence.current) setError(errorMessage(cause));
            } finally {
              if (request === sequence.current) setOlderBusy(false);
            }
          }}
        >
          {olderBusy ? tr('Yükleniyor...') : tr('Önceki mesajlar')}
        </button>
      )}
      {loading ? (
        <EmptyState loading />
      ) : (
        <div className="conversation" aria-label={tr('Mesaj geçmişi')}>
          {!items.length ? (
            <EmptyState title={tr('Henüz mesaj yok')} />
          ) : (
            items.map(message => (
              <article
                className={`message-line ${
                  message.senderRole === 'candidate' ? 'candidate' : 'admin'
                }`}
                key={message.id}
              >
                <strong>
                  {message.senderRole === 'candidate'
                    ? tr('Aday')
                    : tr('Yönetici')}
                </strong>
                <p>{message.content}</p>
                <time>{formatDate(message.createdAt)}</time>
              </article>
            ))
          )}
        </div>
      )}
      <form
        className="workflow-form"
        onSubmit={async e => {
          e.preventDefault();
          if (!content.trim() || sendLock.current) return;
          sendLock.current = true;
          setBusy(true);
          setError('');
          try {
            const sent = await api.sendMessage(threadId, content.trim());
            setItems(previous => [...previous, sent]);
            setTotal(previous => previous + 1);
            setContent('');
            onRead?.();
          } catch (cause) {
            setError(errorMessage(cause));
          } finally {
            sendLock.current = false;
            setBusy(false);
          }
        }}
      >
        <label>
          {tr('Mesaj')}
          <textarea
            required
            maxLength={4000}
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </label>
        <button className="primary" disabled={busy || !content.trim()}>
          <Send size={17} />
          {busy ? tr('Gönderiliyor...') : tr('Gönder')}
        </button>
      </form>
    </section>
  );
};
export const MessagesView = () => {
  const [summaryRefresh, setSummaryRefresh] = useState(0);
  const refreshSummary = useCallback(
    () => setSummaryRefresh(value => value + 1),
    [],
  );
  const [summaryItems, setSummaryItems] = useState<ThreadSummary[]>([]),
    [summaryPage, setSummaryPage] = useState(1),
    [summaryTotal, setSummaryTotal] = useState(0),
    [summaryLoading, setSummaryLoading] = useState(false),
    [summaryError, setSummaryError] = useState('');
  useEffect(() => {
    let current = true;
    setSummaryLoading(true);
    setSummaryError('');
    api
      .messageSummaryPage(summaryPage)
      .then(result => {
        if (current) {
          setSummaryItems(result.items);
          setSummaryTotal(result.total);
        }
      })
      .catch(cause => {
        if (current) setSummaryError(errorMessage(cause));
      })
      .finally(() => {
        if (current) setSummaryLoading(false);
      });
    return () => {
      current = false;
    };
  }, [summaryPage, summaryRefresh]);
  const [thread, setThread] = useState(''),
    [query, setQuery] = useState(''),
    [candidates, setCandidates] = useState<User[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    if (!query.trim()) {
      setCandidates([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .candidatePage(
          new URLSearchParams({ page: '1', pageSize: '25', q: query }),
        )
        .then(page => {
          if (current) setCandidates(page.items);
        })
        .catch(cause => {
          if (current) setError(errorMessage(cause));
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);
  const chooseThread = (id: string) => {
    if (id !== thread && confirmLeave()) setThread(id);
  };
  return (
    <>
      <Feedback error={error || summaryError} />
      <section className="toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={tr('Genel mesaj için aday ara')}
        />
      </section>
      <div className="workflow-split">
        <section className="thread-list" aria-label={tr('Konuşmalar')}>
          {candidates.map(candidate => (
            <button
              className="thread-button"
              key={candidate.id}
              onClick={() => chooseThread(`general:${candidate.id}`)}
            >
              <Person name={candidate.name} detail={candidate.email} />
            </button>
          ))}
          {summaryItems.map(item => (
            <button
              className={`thread-button${
                thread === item.threadId ? ' selected' : ''
              }`}
              key={item.threadId}
              onClick={() => chooseThread(item.threadId)}
            >
              <strong>{item.name || tr('Konuşma')}</strong>
              <span>
                {item.threadId.startsWith('general:')
                  ? tr('Genel mesajlar')
                  : item.programName || tr('Başvuru mesajları')}
              </span>
              <span>
                {item.unread
                  ? `${item.unread} ${tr('okunmamış')}`
                  : formatDate(item.updatedAt)}
              </span>
            </button>
          ))}
          {summaryLoading && <EmptyState loading />}
          {summaryTotal > 25 && (
            <div className="button-row">
              <button
                className="secondary"
                disabled={summaryLoading || summaryPage === 1}
                onClick={() => setSummaryPage(value => value - 1)}
              >
                {tr('Önceki')}
              </button>
              <span>
                {summaryPage} / {Math.ceil(summaryTotal / 25)}
              </span>
              <button
                className="secondary"
                disabled={summaryLoading || summaryPage * 25 >= summaryTotal}
                onClick={() => setSummaryPage(value => value + 1)}
              >
                {tr('Sonraki')}
              </button>
            </div>
          )}
        </section>
        <div>
          {thread ? (
            <ThreadView
              key={thread}
              threadId={thread}
              onRead={refreshSummary}
            />
          ) : (
            <EmptyState title={tr('Bir konuşma seçin')} />
          )}
        </div>
      </div>
    </>
  );
};
export const DeletionRequestsView = () => {
  const requests = useCollection(api.deletionRequests);
  const [selected, setSelected] = useState<DeletionRequest>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  return (
    <>
      <Feedback error={error || requests.error} success={notice} />
      {requests.loading ? (
        <EmptyState loading />
      ) : !requests.items.length ? (
        <EmptyState
          title={tr('Bekleyen hesap silme talebi yok')}
          onRetry={requests.load}
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tr('Aday')}</th>
                <th>{tr('Talep tarihi')}</th>
                <th>{tr('Durum')}</th>
                <th>{tr('İşlem')}</th>
              </tr>
            </thead>
            <tbody>
              {requests.items.map(item => (
                <tr key={item.id}>
                  <td>
                    <Person name={item.name} detail={item.email} />
                  </td>
                  <td>{formatDate(item.requestedAt)}</td>
                  <td>
                    {item.status === 'approved'
                      ? tr('Dosya temizliği sürüyor')
                      : tr('İnceleme bekliyor')}
                  </td>
                  <td>
                    <button
                      className="secondary"
                      onClick={() => setSelected(item)}
                    >
                      <Trash2 size={16} />
                      {tr('İncele')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <Modal
          title={tr('Hesap silme talebi')}
          onClose={() => setSelected(undefined)}
          busy={busy}
        >
          <div className="dialog-body workflow-form">
            <p>
              {selected.name} · {selected.email}
            </p>
            <p>{selected.reason || tr('Gerekçe belirtilmemiş.')}</p>
            <p>
              {tr(
                'Kişisel bilgiler anonimleştirilecek ve belge dosyaları silinecek. Bu işlem geri alınamaz. Denetim kayıtları korunur.',
              )}
            </p>
            <button
              className="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  const result = await api.completeDeletion(selected.id);
                  setNotice(result.message);
                  setSelected(undefined);
                  await requests.load();
                } catch (cause) {
                  setError(errorMessage(cause));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={16} />
              {busy ? tr('İşleniyor...') : tr('Anonimleştir ve belgeleri sil')}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export const DocumentHistory = ({
  applicationId,
  program,
}: {
  applicationId: string;
  program?: Program;
}) => {
  const [open, setOpen] = useState(false),
    [error, setError] = useState('');
  const history = useCollection(
    useCallback(
      () => (open ? api.documentHistory(applicationId) : Promise.resolve([])),
      [open, applicationId],
    ),
  );
  return (
    <section className="detail-section">
      <button className="secondary" onClick={() => setOpen(value => !value)}>
        <Archive size={16} />
        {open ? tr('Geçmişi kapat') : tr('Belge yükleme geçmişi')}
      </button>
      <Feedback error={error || history.error} />
      {open &&
        history.items.map(doc => (
          <div className="history-line" key={doc.id}>
            <span>
              {documentLabel(doc, program)} · v{doc.version || 1} ·{' '}
              {doc.isCurrent ? tr('Güncel') : tr('Önceki')}
              <small>{formatDate(doc.uploadedAt)}</small>
            </span>
            <button
              className="icon-button"
              title={tr('Orijinal dosyayı indir')}
              aria-label={`${doc.fileName} ${tr('indir')}`}
              onClick={() =>
                api
                  .downloadDocument(doc.id, doc.fileName)
                  .catch(cause => setError(errorMessage(cause)))
              }
            >
              <Download size={17} />
            </button>
          </div>
        ))}
    </section>
  );
};

// Documents the admin names for this program; members see each one by this name.
function CustomDocuments({
  items,
  disabled,
  onChange,
}: {
  items: ChecklistItem[];
  disabled: boolean;
  onChange: (items: ChecklistItem[]) => void;
}) {
  const update = (key: string, patch: Partial<ChecklistItem>) =>
    onChange(items.map(item => (item.key === key ? { ...item, ...patch } : item)));
  return (
    <fieldset className="custom-documents">
      <legend>{tr('Programa özel belgeler')}</legend>
      <p className="muted">
        {tr(
          'Listede olmayan bir belge isteyin. Adaylar bu belgeyi yazdığınız adla görür ve ayrıca yükler; programdaki mevcut başvurulara da eklenir.',
        )}
      </p>
      {items.map((item, index) => (
        <div className="custom-document" key={item.key}>
          <label>
            {tr('Belge adı')}
            <input
              required
              minLength={2}
              maxLength={120}
              placeholder={tr('Örn. Sağlık sigortası poliçesi')}
              value={item.label || ''}
              disabled={disabled}
              onChange={e => update(item.key!, { label: e.target.value })}
            />
          </label>
          <label>
            {tr('Açıklama (isteğe bağlı)')}
            <textarea
              rows={2}
              maxLength={1000}
              placeholder={tr('Adaya ne yüklemesi gerektiğini kısaca anlatın.')}
              value={item.description || ''}
              disabled={disabled}
              onChange={e =>
                update(item.key!, { description: e.target.value || undefined })
              }
            />
          </label>
          <label>
            {tr('Hangi aşamada istenir')}
            <select
              value={item.requiredStage || 'application_stage'}
              disabled={disabled}
              onChange={e => update(item.key!, { requiredStage: e.target.value })}
            >
              <option value="application_stage">{tr('Başvuru Aşaması')}</option>
              <option value="erasmus_stage">
                {tr('Hareketlilik / Erasmus Aşaması')}
              </option>
            </select>
          </label>
          <button
            type="button"
            className="secondary small"
            disabled={disabled}
            aria-label={`${item.label || tr('Özel belge') + ' ' + (index + 1)} ${tr('kaldır')}`}
            onClick={() => onChange(items.filter(other => other.key !== item.key))}
          >
            <Trash2 size={16} /> {tr('Kaldır')}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary small"
        disabled={disabled || items.length >= 20}
        onClick={() =>
          onChange([
            ...items,
            {
              documentType: 'extra',
              key: newRequirementKey(),
              label: '',
              expectedFormat: 'PDF / JPG / PNG',
              requiredStage: 'application_stage',
            },
          ])
        }
      >
        <Plus size={16} /> {tr('Özel belge ekle')}
      </button>
    </fieldset>
  );
}
