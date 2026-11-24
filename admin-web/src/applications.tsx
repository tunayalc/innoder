import { translate as tr } from './locale';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  FileText,
  Filter,
  LoaderCircle,
  Plane,
  RefreshCw,
  Share2,
  X,
} from 'lucide-react';
import { api, RequestError } from './api';
import { ApplicationDocumentUpload } from './ApplicationDocumentUpload';
import { DocumentHistory, ThreadView, confirmLeave } from './workflows';
import {
  applicantName,
  dateBoundaryISO,
  DOCUMENTS,
  formatBytes,
  formatDate,
  normalizeApplication,
  STAGES,
} from './domain';
import { usePage } from './usePage';
import { useCollection } from './hooks';
import {
  EmptyState,
  errorMessage,
  EventLink,
  Feedback,
  Modal,
  PAGE_SIZE,
  Pagination,
  SearchField,
} from './ui';
import type { Application, Document, Stage, User } from './types';

const STAGE_ICONS = {
  application_stage: CircleDashed,
  erasmus_stage: Plane,
  returned_home: CheckCircle2,
};
const STAGE_FILTER_LABELS: Record<Stage, string> = {
  application_stage: tr('Başvuru'),
  erasmus_stage: 'Hareketlilik / Erasmus',
  returned_home: tr('Dönüş tamamlandı'),
};

const StageIndicator = ({ stage }: { stage: Stage }) => {
  const Icon = STAGE_ICONS[stage];
  return (
    <span className={`stage-label ${stage}`}>
      <Icon size={15} aria-hidden="true" />
      <span>{STAGES[stage]}</span>
    </span>
  );
};

const ApplicationBloodGroup = ({
  applicationId,
}: {
  applicationId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    api
      .applicationBloodGroup(applicationId, controller.signal)
      .then(data => {
        if (!controller.signal.aborted)
          setValue(data.bloodGroup ?? tr('Paylaşılmadı'));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      });
    return () => controller.abort();
  }, [applicationId, open]);
  return (
    <div>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          setOpen(!open);
          setValue(undefined);
          setError('');
        }}
        aria-expanded={open}
      >
        <Eye size={16} aria-hidden="true" />
        {open ? tr('Kan grubunu gizle') : tr('Kan grubunu göster')}
      </button>
      {open && !error && <p role="status">{value ?? tr('Yükleniyor…')}</p>}
      {error && <Feedback error={error} />}
    </div>
  );
};

export const ApplicationsView = () => {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage | ''>('');
  const [decision, setDecision] = useState('');
  const [advanced, setAdvanced] = useState(false),
    [programId, setProgramId] = useState(''),
    [hasIssues, setHasIssues] = useState(''),
    [after, setAfter] = useState(''),
    [before, setBefore] = useState('');
  const programs = useCollection(api.programs);
  const [page, setPage] = useState(0);
  const filterParams = useMemo(
    () =>
      new URLSearchParams({
        q: query,
        ...(stage ? { status: stage } : {}),
        ...(decision ? { decisionStatus: decision } : {}),
        ...(programId ? { programId } : {}),
        ...(hasIssues ? { hasIssues } : {}),
        ...(after ? { createdAfterISO: dateBoundaryISO(after) } : {}),
        ...(before ? { createdBeforeISO: dateBoundaryISO(before, true) } : {}),
      }),
    [query, stage, decision, programId, hasIssues, after, before],
  );
  const { items, total, loading, error, load } = usePage(
    useCallback(async () => {
      const params = new URLSearchParams(filterParams);
      params.set('page', String(page + 1));
      params.set('pageSize', String(PAGE_SIZE));
      const result = await api.applicationPage(params);
      return { ...result, items: result.items.map(normalizeApplication) };
    }, [filterParams, page]),
  );
  const candidateById = useMemo(
    () =>
      new Map(
        items.map(item => [
          item.userId,
          {
            id: item.userId,
            name: applicantName(item),
            email: item.candidateEmail || '',
            phone: item.candidatePhone,
            role: 'candidate',
            status: 'active',
            mustChangePassword: false,
            createdAt: item.createdAt,
          } as User,
        ]),
      ),
    [items],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string>();
  const [actionError, setActionError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const allCheckbox = useRef<HTMLInputElement>(null);
  const visible = items;
  const selectedVisible = visible.filter(item => selected.has(item.id)).length;
  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [query, stage, decision, programId, hasIssues, after, before]);
  useEffect(() => {
    setPage(current =>
      Math.min(current, Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)),
    );
  }, [items, total]);
  useEffect(() => {
    if (allCheckbox.current)
      allCheckbox.current.indeterminate =
        selectedVisible > 0 && selectedVisible < visible.length;
  }, [selectedVisible, visible.length]);
  const download = async (run: () => Promise<unknown>) => {
    setDownloading(true);
    setActionError('');
    try {
      await run();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setDownloading(false);
    }
  };
  const chooseSelected = (next: Set<string>) => {
    if (next.size > 100) {
      setActionError(
        tr('Tek bir ZIP paketi için en fazla 100 başvuru seçebilirsiniz.'),
      );
      return;
    }
    setActionError('');
    setSelected(next);
  };
  return (
    <>
      <section className="stage-filters" aria-label={tr('Başvuru aşamaları')}>
        <button
          className={`stage-filter${!stage ? ' selected' : ''}`}
          aria-pressed={!stage}
          onClick={() => setStage('')}
        >
          {tr('Tümü')}
        </button>
        {Object.entries(STAGE_FILTER_LABELS).map(([key, label]) => {
          const Icon = STAGE_ICONS[key as Stage];
          return (
            <button
              key={key}
              className={`stage-filter${stage === key ? ' selected' : ''}`}
              title={STAGES[key as Stage]}
              aria-pressed={stage === key}
              onClick={() => setStage(stage === key ? '' : (key as Stage))}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </section>
      <div className="application-tools">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={tr('Aday, e-posta veya program ara')}
        />
        <div className="button-row">
          <select
            aria-label={tr('Dışa aktar')}
            value=""
            disabled={downloading || loading}
            onChange={event => {
              if (event.target.value === 'all:csv') {
                void download(api.downloadCsv);
                return;
              }
              const [scope, format] = event.target.value.split(':');
              if (!format) return;
              const params =
                scope === 'selected'
                  ? new URLSearchParams({
                      applicationIds: [...selected].join(','),
                    })
                  : new URLSearchParams(filterParams);
              void download(() =>
                api.downloadApplications(format as 'csv' | 'xlsx', params),
              );
            }}
          >
            <option value="">{tr('Dışa aktar')}</option>
            <option value="all:csv">{tr('Tüm başvurular (CSV)')}</option>
            <option value="filtered:csv">{tr('Filtreli CSV')}</option>
            <option value="filtered:xlsx">
              {tr('Filtreli Excel (.xlsx)')}
            </option>
            <option value="selected:csv" disabled={!selected.size}>
              {tr('Seçili CSV')}
            </option>
            <option value="selected:xlsx" disabled={!selected.size}>
              {tr('Seçili Excel (.xlsx)')}
            </option>
          </select>
          <button
            className="icon-button"
            title={tr('Başvuruları yenile')}
            aria-label={tr('Başvuruları yenile')}
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>
      <section
        className="toolbar application-filters"
        aria-label={tr('Başvuru filtreleri')}
      >
        <select
          aria-label={tr('Başvuru kararı filtresi')}
          value={decision}
          onChange={e => setDecision(e.target.value)}
        >
          <option value="">{tr('Tüm kararlar')}</option>
          <option value="active">{tr('Aktif')}</option>
          <option value="rejected">{tr('Reddedildi')}</option>
        </select>
        <button
          className={`secondary filter-toggle${advanced ? ' selected' : ''}`}
          title={tr('Ayrıntılı filtreler')}
          aria-label={tr('Ayrıntılı filtreler')}
          aria-expanded={advanced}
          onClick={() => setAdvanced(value => !value)}
        >
          <Filter size={16} /> {tr('Filtreler')}
        </button>
        {(query ||
          stage ||
          decision ||
          programId ||
          hasIssues ||
          after ||
          before) && (
          <button
            className="icon-button"
            title={tr('Filtreleri temizle')}
            aria-label={tr('Filtreleri temizle')}
            onClick={() => {
              setQuery('');
              setStage('');
              setDecision('');
              setProgramId('');
              setHasIssues('');
              setAfter('');
              setBefore('');
            }}
          >
            <X size={17} />
          </button>
        )}
        <span className="result-count" role="status">
          {loading ? tr('Yükleniyor…') : `${total} ${tr('başvuru')}`}
        </span>
      </section>
      {advanced && (
        <section
          className="advanced-filters"
          aria-label={tr('Ayrıntılı başvuru filtreleri')}
        >
          <label>
            {tr('Program')}
            <select
              value={programId}
              onChange={event => setProgramId(event.target.value)}
            >
              <option value="">{tr('Tüm programlar')}</option>
              {programs.items.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name} · {program.year}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr('Belge durumu')}
            <select
              value={hasIssues}
              onChange={event => setHasIssues(event.target.value)}
            >
              <option value="">{tr('Tüm belgeler')}</option>
              <option value="true">{tr('Eksik veya düzeltme bekleyen')}</option>
              <option value="false">{tr('Belge sorunu olmayan')}</option>
            </select>
          </label>
          <label>
            {tr('Başvuru başlangıcı')}
            <input
              type="date"
              value={after}
              max={before || undefined}
              onChange={event => setAfter(event.target.value)}
            />
          </label>
          <label>
            {tr('Başvuru bitişi')}
            <input
              type="date"
              value={before}
              min={after || undefined}
              onChange={event => setBefore(event.target.value)}
            />
          </label>
          <Feedback error={programs.error} />
        </section>
      )}
      {selected.size > 0 && (
        <div className="selection-bar">
          <span>
            {selected.size} {tr('başvuru seçildi')}
          </span>
          <button
            className="secondary small"
            disabled={downloading}
            onClick={() => void download(() => api.downloadZip([...selected]))}
          >
            {downloading ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <FileArchive size={17} />
            )}{' '}
            {tr('Belgeleri indir (ZIP)')}
          </button>
          <button
            className="icon-button bare"
            title={tr('Seçimi temizle')}
            aria-label={tr('Seçimi temizle')}
            onClick={() => setSelected(new Set())}
          >
            <X size={17} />
          </button>
        </div>
      )}
      <Feedback error={error || actionError} />
      <div
        className="table-wrap"
        role="region"
        aria-label={tr('Başvuru listesi')}
        tabIndex={0}
        aria-busy={loading}
      >
        <table className="applications-table">
          <thead>
            <tr>
              <th className="check-col">
                <input
                  ref={allCheckbox}
                  type="checkbox"
                  aria-label={tr('Bu sayfadaki tüm başvuruları seç')}
                  checked={
                    visible.length > 0 && selectedVisible === visible.length
                  }
                  disabled={!visible.length}
                  onChange={event => {
                    const next = new Set(selected);
                    visible.forEach(item =>
                      event.target.checked
                        ? next.add(item.id)
                        : next.delete(item.id),
                    );
                    chooseSelected(next);
                  }}
                />
              </th>
              <th>{tr('Aday')}</th>
              <th>{tr('Program')}</th>
              <th>{tr('Aşama')}</th>
              <th>{tr('Karar')}</th>
              <th>{tr('Son güncelleme')}</th>
              <th>
                <span className="sr-only">{tr('İşlemler')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!visible.length && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    loading={loading}
                    title={
                      error
                        ? tr('Başvurular yüklenemedi')
                        : tr('Başvuru bulunamadı')
                    }
                    onRetry={error ? () => void load() : undefined}
                  >
                    {query || stage || decision
                      ? tr('Arama ve filtreleri değiştirerek tekrar deneyin.')
                      : tr('Yeni başvurular burada görünecek.')}
                  </EmptyState>
                </td>
              </tr>
            )}
            {visible.map(item => (
              <tr
                key={item.id}
                className={selected.has(item.id) ? 'row-selected' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${applicantName(item)} ${tr(
                      'başvurusunu seç',
                    )}`}
                    checked={selected.has(item.id)}
                    onChange={() => {
                      const next = new Set(selected);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      chooseSelected(next);
                    }}
                  />
                </td>
                <td>
                  <button
                    className="person-button"
                    onClick={() => setDetailId(item.id)}
                  >
                    <span className="applicant-identity">
                      <strong>{applicantName(item)}</strong>
                      <span>
                        {candidateById.get(item.userId)?.email ||
                          item.personalInfo.email ||
                          `#${item.id.slice(0, 8)}`}
                      </span>
                    </span>
                  </button>
                </td>
                <td>
                  <span className="program-name">{item.programName}</span>
                </td>
                <td>
                  <StageIndicator stage={item.status} />
                </td>
                <td>
                  <span
                    className={`decision-label ${
                      item.decisionStatus === 'rejected' ? 'rejected' : 'active'
                    }`}
                  >
                    {item.decisionStatus === 'rejected'
                      ? tr('Reddedildi')
                      : tr('Aktif')}
                  </span>
                </td>
                <td className="date-cell">{formatDate(item.updatedAt)}</td>
                <td>
                  <button
                    className="icon-button bare"
                    title={`${applicantName(item)} ${tr('başvurusunu aç')}`}
                    aria-label={`${applicantName(item)} ${tr(
                      'başvurusunu aç',
                    )}`}
                    onClick={() => setDetailId(item.id)}
                  >
                    <ChevronRight size={19} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} onChange={setPage} />
      {detailId && (
        <ApplicationDrawer
          id={detailId}
          candidate={candidateById.get(
            items.find(item => item.id === detailId)?.userId || '',
          )}
          onClose={() => setDetailId(undefined)}
          onChange={load}
        />
      )}
    </>
  );
};

const ApplicationDrawer = ({
  id,
  candidate,
  onClose,
  onChange,
}: {
  id: string;
  candidate?: User;
  onClose: () => void;
  onChange: () => void;
}) => {
  const [item, setItem] = useState<Application>();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'stage' | 'reject' | 'activate'>();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [reason, setReason] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setError('');
    setLoading(true);
    try {
      const result = await api.application(id);
      if (request === sequence.current) setItem(normalizeApplication(result));
    } catch (cause) {
      if (request === sequence.current) setError(errorMessage(cause));
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, [load]);
  const mutate = async (event: FormEvent) => {
    event.preventDefault();
    if (!item) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result =
        action === 'stage'
          ? await api.setStage(
              item.id,
              item.status === 'application_stage'
                ? 'erasmus_stage'
                : 'returned_home',
              item.revision,
            )
          : await api.setDecision(
              item.id,
              action === 'reject' ? 'rejected' : 'active',
              reason.trim(),
              item.revision,
            );
      sequence.current++;
      setLoading(false);
      setItem(normalizeApplication(result));
      setAction(undefined);
      setReason('');
      setSuccess(tr('Başvuru güncellendi.'));
      onChange();
    } catch (cause) {
      if (cause instanceof RequestError && cause.status === 409) await load();
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      drawer
      title={item ? applicantName(item) : tr('Başvuru detayı')}
      subtitle={item?.programName}
      onClose={() => {
        if (confirmLeave()) onClose();
      }}
      busy={busy}
    >
      <div className="drawer-content">
        <Feedback error={error} success={success} />
        {!item ? (
          <EmptyState
            loading={loading}
            title={tr('Başvuru yüklenemedi')}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <section className="detail-section">
              <h3>{tr('CV ve motivasyon')}</h3>
              <div className="button-row">
                {(['cv', 'motivation'] as const).map(kind => (
                  <button
                    className="secondary"
                    key={kind}
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      try {
                        await api.downloadPdf(item.id, kind);
                      } catch (cause) {
                        setError(errorMessage(cause));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Download size={17} />
                    {kind === 'cv' ? 'CV PDF' : tr('Motivasyon PDF')}
                  </button>
                ))}
              </div>
            </section>
            <section className="detail-section">
              <div className="section-heading">
                <h3>{tr('Başvuru süreci')}</h3>
                <span
                  className={`badge ${
                    item.decisionStatus === 'rejected' ? 'rejected' : 'active'
                  }`}
                >
                  {item.decisionStatus === 'rejected'
                    ? tr('Reddedildi')
                    : tr('Aktif')}
                </span>
              </div>
              <ol className="stage-timeline">
                {Object.entries(STAGES).map(([key, label], index) => {
                  const current = Object.keys(STAGES).indexOf(item.status);
                  return (
                    <li
                      key={key}
                      className={index <= current ? 'complete' : ''}
                      aria-current={key === item.status ? 'step' : undefined}
                    >
                      <span className="step-number">
                        {index < current ? <Check size={14} /> : index + 1}
                      </span>
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="button-row">
                {item.status !== 'returned_home' &&
                  item.decisionStatus === 'active' && (
                    <button
                      className="primary"
                      disabled={busy || loading || !item.submittedAt}
                      title={
                        !item.submittedAt
                          ? tr('Başvuru aday tarafından henüz gönderilmedi.')
                          : undefined
                      }
                      onClick={() => {
                        setAction('stage');
                        setSuccess('');
                      }}
                    >
                      <ArrowRight size={17} />
                      {item.status === 'application_stage'
                        ? tr('Erasmus aşamasına al')
                        : tr('Ülkeye dönüşü tamamla')}
                    </button>
                  )}
                <button
                  className={
                    item.decisionStatus === 'rejected' ? 'secondary' : 'danger'
                  }
                  disabled={busy}
                  onClick={() => {
                    setAction(
                      item.decisionStatus === 'rejected'
                        ? 'activate'
                        : 'reject',
                    );
                    setSuccess('');
                  }}
                >
                  {item.decisionStatus === 'rejected'
                    ? tr('Kararı aktife al')
                    : tr('Başvuruyu reddet')}
                </button>
              </div>
              {!item.submittedAt && (
                <p className="form-note">
                  {tr('Taslak başvuru. Aday tarafından henüz gönderilmedi.')}
                </p>
              )}
              {action && (
                <form className="action-form stack" onSubmit={mutate}>
                  <strong>
                    {action === 'stage'
                      ? `Yeni aşama: ${
                          STAGES[
                            item.status === 'application_stage'
                              ? 'erasmus_stage'
                              : 'returned_home'
                          ]
                        }`
                      : action === 'reject'
                      ? tr('Ret kararı')
                      : tr('Başvuru yeniden aktif olacak')}
                  </strong>
                  {action === 'reject' && (
                    <label>
                      {tr('Ret gerekçesi')}
                      <textarea
                        autoFocus
                        required
                        maxLength={2000}
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                      />
                    </label>
                  )}
                  <div className="button-row">
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() => setAction(undefined)}
                    >
                      {tr('Vazgeç')}
                    </button>
                    <button
                      className={action === 'reject' ? 'danger' : 'primary'}
                      disabled={busy || (action === 'reject' && !reason.trim())}
                    >
                      {busy && <LoaderCircle size={17} className="spin" />}
                      {tr('Onayla')}
                    </button>
                  </div>
                </form>
              )}
              {item.decisionReason && (
                <div className="reason">
                  <strong>{tr('Ret gerekçesi')}</strong>
                  <p>{item.decisionReason}</p>
                </div>
              )}
            </section>
            <DocumentHistory applicationId={item.id} />
            <details
              className="detail-section"
              onToggle={event => setMessagesOpen(event.currentTarget.open)}
            >
              <summary>{tr('Başvuru mesajları')}</summary>
              {messagesOpen && <ThreadView threadId={item.id} />}
            </details>
            <details
              className="detail-section"
              onToggle={event =>
                setGeneralOpen(event.currentTarget.open)
              }
            >
              <summary>{tr('Genel mesajlar')}</summary>
              {generalOpen && (
                <ThreadView threadId={`general:${item.userId}`} />
              )}
            </details>
            <section className="detail-section">
              <h3>{tr('Kişisel bilgiler')}</h3>
              <dl className="details">
                {[
                  [tr('Ad soyad'), applicantName(item)],
                  [tr('E-posta'), candidate?.email || item.personalInfo.email],
                  [tr('Telefon'), candidate?.phone || item.personalInfo.phone],
                  [tr('Uyruk'), item.personalInfo.nationality],
                  [
                    tr('Kimlik türü'),
                    item.personalInfo.identityType === 'turkish_id'
                      ? tr('T.C. kimlik kartı')
                      : item.personalInfo.identityType === 'passport'
                      ? tr('Pasaport')
                      : item.personalInfo.identityType,
                  ],
                  [tr('Doğum tarihi'), item.personalInfo.birthDate],
                  [
                    tr('Başvuru tarihi'),
                    formatDate(item.submittedAt || item.createdAt),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value || '—'}</dd>
                  </div>
                ))}
                <div>
                  <dt>{tr('Etkinlik bağlantısı')}</dt>
                  <dd>
                    <EventLink value={item.candidateEventLink} />
                  </dd>
                </div>
              </dl>
              <ApplicationBloodGroup key={item.id} applicationId={item.id} />
            </section>
            <section className="detail-section">
              <div className="section-heading">
                <h3>
                  {tr('Belgeler')}{' '}
                  <span className="count">{item.documents.length}</span>
                </h3>
                <span className="muted">
                  {item.documents.filter(doc => doc.status === 'ok').length}{' '}
                  {tr('uygun')}
                </span>
              </div>
              <ApplicationDocumentUpload
                key={item.id}
                application={item}
                onUploaded={doc => {
                  setItem(current =>
                    current && doc.isCurrent !== false
                      ? {
                          ...current,
                          documents: [
                            ...current.documents.filter(
                              previous =>
                                previous.id !== doc.id &&
                                (doc.type === 'extra' ||
                                  previous.type !== doc.type),
                            ),
                            doc,
                          ],
                        }
                      : current,
                  );
                  void load();
                }}
              />
              {!item.documents.length && (
                <EmptyState title={tr('Henüz belge yüklenmemiş')} />
              )}
              {item.documents.map(doc => (
                <DocumentRow
                  key={doc.id}
                  applicationId={item.id}
                  document={doc}
                  onChange={() => {
                    void load();
                    onChange();
                  }}
                />
              ))}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
};

/** Review templates, matching the mobile verification screen. */
const QUICK_TEMPLATES: ReadonlyArray<{
  label: string;
  status: Document['status'];
  message: string;
}> = [
  { label: tr('Uygun'), status: 'ok', message: tr('Belgeniz onaylandı.') },
  {
    label: tr('Eksik'),
    status: 'missing',
    message: tr('Belge eksik. Lütfen gerekli belgeyi yükleyin.'),
  },
  {
    label: tr('Yanlış format'),
    status: 'wrong_format',
    message: tr(
      'Yüklenen dosya beklenen formatta değil. Lütfen doğru formatta yükleyin.',
    ),
  },
  {
    label: tr('Okunamıyor'),
    status: 'wrong_format',
    message: tr(
      'Yüklenen görüntü bulanık/okunamıyor. Lütfen daha net bir görüntü çekin.',
    ),
  },
];
const needsFix = (status: Document['status']) =>
  status === 'missing' || status === 'wrong_format';
const defaultMessage = (status: Document['status']) =>
  QUICK_TEMPLATES.find(item => item.status === status)?.message || '';

const DocumentRow = ({
  applicationId,
  document: doc,
  onChange,
}: {
  applicationId: string;
  document: Document;
  onChange: () => void;
}) => {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const [status, setStatus] = useState(doc.status);
  const [note, setNote] = useState(doc.verifyNote || '');
  const [notify, setNotify] = useState(true);
  const [preview, setPreview] =
    useState<Awaited<ReturnType<typeof api.previewDocument>>>();
  const previewRef = useRef<string | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);
  const run = async (action: () => Promise<unknown>, refresh = true) => {
    setError('');
    setBusy(true);
    try {
      await action();
      if (refresh) onChange();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  const previewFile = async () => {
    const prepared = await api.previewDocument(doc.id, doc.fileName);
    if (!mounted.current) {
      URL.revokeObjectURL(prepared.url);
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = prepared.url;
    setPreview(prepared);
  };
  const closePreview = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = undefined;
    setPreview(undefined);
  };
  return (
    <article className="document-row">
      <div className={`document-icon${doc.status === 'ok' ? ' approved' : ''}`}>
        {doc.status === 'ok' ? (
          <FileCheck2 size={20} />
        ) : (
          <FileText size={20} />
        )}
      </div>
      <div className="document-main">
        <strong>{DOCUMENTS[doc.type] || doc.type}</strong>
        <span>
          {doc.fileName} · {formatBytes(doc.sizeBytes)}
        </span>
        <div className="document-actions">
          <span
            className={`badge ${
              doc.status === 'ok'
                ? 'active'
                : doc.status === 'unread'
                ? 'neutral'
                : 'rejected'
            }`}
          >
            {
              {
                ok: tr('Uygun'),
                unread: tr('İncelenmedi'),
                missing: tr('Eksik'),
                wrong_format: tr('Düzeltme gerekli'),
              }[doc.status]
            }
          </span>
          <button
            className="icon-button"
            title={tr('Belgeyi önizle')}
            aria-label={`${doc.fileName} önizle`}
            disabled={busy}
            onClick={() => void run(previewFile, false)}
          >
            <Eye size={17} />
          </button>
          <button
            className="icon-button"
            title={tr('Orijinal dosyayı indir')}
            aria-label={`${doc.fileName} ${tr('indir')}`}
            disabled={busy}
            onClick={() =>
              void run(() => api.downloadDocument(doc.id, doc.fileName), false)
            }
          >
            <Download size={17} />
          </button>
          <button
            className="secondary small"
            disabled={busy}
            onClick={() => {
              setStatus(doc.status);
              setNote(doc.verifyNote || '');
              setReview(!review);
            }}
          >
            <CheckCircle2 size={15} /> {tr('İncele')}
          </button>
          {doc.physicalDeliveryStatus !== 'not_required' && (
            <button
              className={`secondary small${
                doc.physicalDeliveryStatus === 'delivered' ? ' delivered' : ''
              }`}
              disabled={busy}
              onClick={() =>
                void run(() =>
                  api.setPhysicalDelivery(
                    applicationId,
                    doc.id,
                    doc.physicalDeliveryStatus === 'delivered'
                      ? 'awaiting_original'
                      : 'delivered',
                  ),
                )
              }
            >
              <Archive size={15} />
              {doc.physicalDeliveryStatus === 'delivered'
                ? tr('Aslı teslim alındı')
                : tr('Aslı teslim alındı işaretle')}
            </button>
          )}
        </div>
        {doc.physicalDeliveryStatus === 'awaiting_original' && (
          <p className="delivery-note">
            {tr('Belgenin aslı elden teslim edilmelidir. Teslim bekleniyor.')}
          </p>
        )}
        {doc.verifyNote && !review && (
          <p className="document-note">{doc.verifyNote}</p>
        )}
        <Feedback error={error} />
        {review && (
          <form
            className="action-form stack"
            onSubmit={event => {
              event.preventDefault();
              void run(async () => {
                await api.verifyDocument(applicationId, doc.id, status, note);
                setReview(false);
                if (notify && needsFix(status)) {
                  const content = `[${DOCUMENTS[doc.type] || doc.type}] ${
                    note.trim() || defaultMessage(status)
                  }`;
                  try {
                    await api.sendMessage(applicationId, content, doc.id);
                  } catch {
                    throw new Error(
                      tr(
                        'İnceleme kaydedildi ancak mesaj gönderilemedi. Mesajlar bölümünden tekrar deneyin.',
                      ),
                    );
                  }
                }
              });
            }}
          >
            <label>
              {tr('Belge durumu')}
              <select
                value={status}
                disabled={busy}
                onChange={e => setStatus(e.target.value as Document['status'])}
              >
                <option value="unread">{tr('İncelenmedi')}</option>
                <option value="ok">{tr('Uygun')}</option>
                <option value="wrong_format">{tr('Düzeltme gerekli')}</option>
                <option value="missing">{tr('Eksik')}</option>
              </select>
            </label>
            <div className="quick-messages" aria-label={tr('Hazır mesajlar')}>
              {QUICK_TEMPLATES.map(template => (
                <button
                  type="button"
                  key={template.label}
                  className="secondary small"
                  disabled={busy}
                  onClick={() => {
                    setStatus(template.status);
                    setNote(template.message);
                  }}
                >
                  {template.label}
                </button>
              ))}
            </div>
            <label>
              {tr('İnceleme notu')}
              <textarea
                maxLength={2000}
                value={note}
                disabled={busy}
                onChange={e => setNote(e.target.value)}
              />
            </label>
            {needsFix(status) && (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={notify}
                  disabled={busy}
                  onChange={e => setNotify(e.target.checked)}
                />
                {tr('Adaya başvuru mesajı olarak gönder')}
              </label>
            )}
            <div className="button-row">
              <button
                type="button"
                className="secondary small"
                disabled={busy}
                onClick={() => setReview(false)}
              >
                {tr('Vazgeç')}
              </button>
              <button className="primary small" disabled={busy}>
                {busy ? tr('Kaydediliyor…') : tr('İncelemeyi kaydet')}
              </button>
            </div>
          </form>
        )}
        {preview && (
          <Modal
            wide
            title={DOCUMENTS[doc.type] || tr('Belge önizleme')}
            subtitle={doc.fileName}
            onClose={closePreview}
          >
            <div className="preview-toolbar">
              <button
                className="secondary"
                onClick={() =>
                  void run(
                    () => api.downloadDocument(doc.id, doc.fileName),
                    false,
                  )
                }
                disabled={busy}
              >
                <Download size={17} /> {tr('Orijinal dosyayı indir')}
              </button>
              {preview.canShare && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      try {
                        await preview.share();
                      } catch (cause) {
                        if (
                          !(
                            cause instanceof DOMException &&
                            cause.name === 'AbortError'
                          )
                        )
                          throw cause;
                      }
                    }, false)
                  }
                >
                  <Share2 size={17} /> {tr('Dosyayı paylaş')}
                </button>
              )}
              <Feedback error={error} />
            </div>
            {doc.mimeType === 'application/pdf' ? (
              <iframe
                className="document-preview"
                src={preview.url}
                title={doc.fileName}
              />
            ) : (
              <img
                className="image-preview"
                src={preview.url}
                alt={doc.fileName}
              />
            )}
          </Modal>
        )}
      </div>
    </article>
  );
};
