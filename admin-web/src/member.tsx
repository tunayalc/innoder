import { translate as tr } from './locale';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Download,
  Eye,
  FileCheck,
  FolderKanban,
  KeyRound,
  Mail,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { api } from './api';
import type { Application, Document, User } from './types';
import {
  CONTACT_LINKS,
  DOCUMENTS,
  STAGES,
  documentLabel,
  documentSlot,
  formatDate,
  itemSlot,
  slotLabel,
} from './domain';
import { useCollection } from './hooks';
import { usePage } from './usePage';
import {
  EmptyState,
  Feedback,
  Modal,
  Pagination,
  PasswordField,
  errorMessage,
} from './ui';
import { ApplicationDocumentUpload } from './ApplicationDocumentUpload';
import { confirmLeave, ThreadView } from './workflows';
import { DraftForm, ProfileForm, useAction } from './memberForms';
import {
  isEuropassCvComplete,
  isMotivationLetterComplete,
} from './shared/europass';

const tabs = {
  overview: tr('Genel bakış'),
  documents: tr('Belgeler'),
  cv: 'Europass CV',
  motivation: tr('Motivasyon mektubu'),
  messages: tr('Mesajlar'),
} as const;
type Tab = keyof typeof tabs;
const documentStatus = {
  ok: tr('Onaylandı'),
  missing: tr('Eksik'),
  wrong_format: tr('Düzeltme istendi'),
  unread: tr('İnceleme bekliyor'),
};
// Upload slots required up to the current stage. A slot is a fixed document type
// or "extra:<key>" for a document the admin named in the program checklist.
function stageTypes(item: Application) {
  const stages = Object.keys(STAGES);
  return [
    ...new Set(
      (item.program?.checklist || [])
        .filter(
          r =>
            stages.indexOf(
              r.requiredStage ||
                (/^boarding_pass|^photo_activity_report$/.test(r.documentType)
                  ? 'erasmus_stage'
                  : 'application_stage'),
            ) <= stages.indexOf(item.status),
        )
        .flatMap(r =>
          r.documentType === 'boarding_pass'
            ? ['boarding_pass_outbound', 'boarding_pass_return']
            : [itemSlot(r)],
        ),
    ),
  ];
}
const requiredTypes = (item: Application) =>
  stageTypes(item).filter(type => type !== 'extra');
const validDoc = (item: Application, type: string) =>
  item.documents.some(
    d =>
      documentSlot(d) === type &&
      d.isCurrent !== false &&
      (d.status === 'ok' || d.status === 'unread'),
  );

export function MemberView({
  view,
  user,
  setUser,
  goProfile,
}: {
  view: string;
  user: User;
  setUser: (user: User) => void;
  goProfile: () => void;
}) {
  if (view === 'profile') return <ProfileForm user={user} onSaved={setUser} />;
  if (view === 'messages') return <MemberMessages userId={user.id} />;
  return <MyPrograms goProfile={goProfile} userId={user.id} name={user.name} />;
}
function MyPrograms({
  goProfile,
  userId,
  name,
}: {
  goProfile: () => void;
  userId: string;
  name?: string;
}) {
  const [page, setPage] = useState(0),
    [selected, select] = useState(''),
    [general, setGeneral] = useState(false);
  const list = usePage(
    useCallback(
      () =>
        api.applicationPage(
          new URLSearchParams({ page: String(page + 1), pageSize: '25' }),
        ),
      [page],
    ),
  );
  const unread = useCollection(
    useCallback(async () => [await api.unread()], []),
  );
  if (general)
    return (
      <>
        <button
          className="text-button"
          onClick={() => {
            if (confirmLeave()) {
              setGeneral(false);
              void unread.load();
            }
          }}
        >
          <ArrowLeft size={16} /> {tr('Programlarım')}
        </button>
        <MemberMessages userId={userId} />
      </>
    );
  if (selected)
    return (
      <MemberApplication
        key={selected}
        id={selected}
        back={() => {
          if (confirmLeave()) {
            select('');
            void list.load();
            void unread.load();
          }
        }}
        goProfile={goProfile}
      />
    );
  const unreadCount = unread.items[0]?.unread ?? 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? tr('Günaydın') : hour < 18 ? tr('İyi günler') : tr('İyi akşamlar');
  const lead = list.items[0];
  const approvedOf = (item: Application) =>
    requiredTypes(item).filter(type =>
      item.documents.some(
        d =>
          documentSlot(d) === type &&
          d.isCurrent !== false &&
          d.status === 'ok',
      ),
    ).length;
  const percent = (value: number, total: number) =>
    `${total ? Math.round((value / total) * 100) : 0}%`;
  return (
    <>
      <header className="member-greeting">
        <span className="brand-eyebrow">inno derneği</span>
        <h1>
          {greeting}, {(name || tr('Aday')).split(' ')[0]}
        </h1>
      </header>
      <Feedback error={unread.error} />
      {list.loading ? (
        <EmptyState loading />
      ) : list.error ? (
        <EmptyState title={tr('Programlar alınamadı')} onRetry={list.load}>
          {list.error}
        </EmptyState>
      ) : !list.items.length || !lead ? (
        <section className="hero-card">
          <span className="hero-eyebrow">{tr('Hoş geldin')}</span>
          <h2>{tr('Henüz atanmış programınız yok')}</h2>
          <p>{tr('Programınız atandığında burada görünecek.')}</p>
          <div className="hero-actions">
            <button className="hero-button" onClick={() => setGeneral(true)}>
              <MessageSquare size={17} /> {tr('Derneğe yaz')}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="hero-card" aria-labelledby="lead-program">
            <span className="hero-eyebrow">{tr('Başvurum')}</span>
            <h2 id="lead-program">{lead.programName}</h2>
            <div
              className="hero-track"
              role="progressbar"
              aria-label={tr('Zorunlu belgeler')}
              aria-valuemin={0}
              aria-valuemax={requiredTypes(lead).length || 1}
              aria-valuenow={approvedOf(lead)}
            >
              <span
                style={{
                  width: percent(approvedOf(lead), requiredTypes(lead).length),
                }}
              />
            </div>
            <p>
              {requiredTypes(lead).length
                ? `${approvedOf(lead)}/${requiredTypes(lead).length} ${tr(
                    'belge onaylandı',
                  )}`
                : tr('Bu aşamada istenen belge yok')}
            </p>
            <div className="hero-actions">
              <button className="hero-button" onClick={() => select(lead.id)}>
                {tr('Başvuruyu aç')} <ArrowRight size={17} />
              </button>
              <button className="hero-link" onClick={() => setGeneral(true)}>
                {tr('Derneğe yaz')}
              </button>
            </div>
          </section>

          <div className="section-row">
            <h2>{tr('Programlarım')}</h2>
          </div>
          <div className="program-grid">
            {list.items.map(item => {
              const total = requiredTypes(item).length;
              const approved = approvedOf(item);
              const next = item.program?.deadlines
                .filter(d => Date.parse(d.dateISO) >= Date.now() - 86400000)
                .sort((a, b) => Date.parse(a.dateISO) - Date.parse(b.dateISO))[0];
              return (
                <button
                  key={item.id}
                  className="program-card"
                  onClick={() => select(item.id)}
                >
                  <span className="program-cover" aria-hidden="true">
                    <span className="program-mark">
                      <FolderKanban size={26} />
                    </span>
                    <b>{item.program?.year}</b>
                  </span>
                  <span className="program-body">
                    <span
                      className={`status-chip ${
                        item.decisionStatus === 'rejected'
                          ? 'rejected'
                          : item.status
                      }`}
                    >
                      {item.decisionStatus === 'rejected'
                        ? tr('Reddedildi')
                        : STAGES[item.status]}
                    </span>
                    <strong>{item.programName}</strong>
                    <small>
                      <FileCheck size={16} /> {approved}/{total}{' '}
                      {tr('belge onaylandı')}
                      {item.submittedAt ? ` · ${tr('Başvuru gönderildi')}` : ''}
                    </small>
                    {next && (
                      <small>
                        <CalendarClock size={16} /> {next.label} ·{' '}
                        {formatDate(next.dateISO)}
                      </small>
                    )}
                    <span className="program-progress" aria-hidden="true">
                      <span style={{ width: percent(approved, total) }} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <Pagination page={page} total={list.total} onChange={setPage} />
        </>
      )}
      {unreadCount > 0 && (
        <button className="member-toast" onClick={() => setGeneral(true)}>
          <MessageSquare size={18} />
          <span>
            {unreadCount} {tr('okunmamış mesajın var')}
          </span>
          <ArrowRight size={18} />
        </button>
      )}
    </>
  );
}
function MemberMessages({ userId }: { userId: string }) {
  const [thread, setThread] = useState('general:' + userId);
  const programs = useCollection(useCallback(() => api.applications(), []));
  return (
    <>
      <label className="member-select">
        {tr('Konuşma')}
        <select
          value={thread}
          onChange={e => {
            if (confirmLeave()) setThread(e.target.value);
          }}
        >
          <option value={'general:' + userId}>{tr('Genel mesajlar')}</option>
          {programs.items.map(p => (
            <option key={p.id} value={p.id}>
              {p.programName}
            </option>
          ))}
        </select>
      </label>
      <Feedback error={programs.error} />
      <ThreadView key={thread} threadId={thread} />
    </>
  );
}
function MemberApplication({
  id,
  back,
  goProfile,
}: {
  id: string;
  back: () => void;
  goProfile: () => void;
}) {
  const [item, setItem] = useState<Application>(),
    [error, setError] = useState(''),
    [attempt, retry] = useState(0),
    [tab, setTab] = useState<Tab>('overview');
  const action = useAction();
  useEffect(() => {
    let current = true;
    setError('');
    api
      .application(id)
      .then(v => {
        if (current) setItem(v);
      })
      .catch(c => {
        if (current) setError(errorMessage(c));
      });
    return () => {
      current = false;
    };
  }, [id, attempt]);
  const open = (t: Tab) => {
    if (confirmLeave()) setTab(t);
  };
  const fields = item?.personalInfo;
  const missingProfile =
    fields &&
    !(
      fields.fullName &&
      fields.nationality &&
      fields.birthDate &&
      (fields.identityType === 'passport'
        ? fields.passportNumber
        : fields.identityNumber)
    );
  const required = item ? requiredTypes(item) : [];
  const missing = item ? required.filter(t => !validDoc(item, t)) : [];
  return (
    <>
      <button className="text-button" onClick={back}>
        <ArrowLeft size={16} /> {tr('Programlarıma dön')}
      </button>
      {error ? (
        <EmptyState
          title={tr('Başvuru alınamadı')}
          onRetry={() => retry(n => n + 1)}
        >
          {error}
        </EmptyState>
      ) : !item ? (
        <EmptyState loading />
      ) : (
        <>
          <header className="member-title">
            <h2>{item.programName}</h2>
            <span>
              {STAGES[item.status]} ·{' '}
              {item.decisionStatus === 'rejected'
                ? tr('Reddedildi')
                : item.submittedAt
                ? tr('Gönderildi')
                : tr('Aktif')}
            </span>
          </header>
          <nav className="member-tabs" aria-label={tr('Başvuru bölümleri')}>
            {(Object.keys(tabs) as Tab[]).map(t => (
              <button
                key={t}
                aria-current={tab === t ? 'page' : undefined}
                onClick={() => open(t)}
              >
                {tabs[t]}
              </button>
            ))}
          </nav>
          {tab === 'overview' && (
            <div className="member-form">
              {item.decisionStatus === 'rejected' && (
                <Feedback
                  error={item.decisionReason || tr('Başvuru reddedildi.')}
                />
              )}
              {item.submittedAt && (
                <Feedback
                  success={`${tr('Başvuru gönderildi')}: ${formatDate(
                    item.submittedAt,
                  )}`}
                />
              )}
              <section>
                <h3>{tr('Başvuru kontrol listesi')}</h3>
                <div className="member-list">
                  {(
                    [
                      [!!missingProfile, tr('Kişisel bilgiler'), goProfile],
                      [
                        !isEuropassCvComplete(fields?.europassCv),
                        'Europass CV',
                        () => open('cv'),
                      ],
                      [
                        !isMotivationLetterComplete(fields?.motivationLetter),
                        tr('Motivasyon mektubu'),
                        () => open('motivation'),
                      ],
                    ] as const
                  ).map(([needed, label, fn]) => (
                    <button key={label} className="member-row" onClick={fn}>
                      <span>{label}</span>
                      <strong>
                        {needed ? tr('Tamamla') : tr('Tamamlandı')}
                      </strong>
                    </button>
                  ))}
                  <button
                    className="member-row"
                    onClick={() => open('documents')}
                  >
                    <span>{tr('Zorunlu belgeler')}</span>
                    <strong>
                      {required.length - missing.length} / {required.length}{' '}
                      {tr('yüklendi')}
                    </strong>
                  </button>
                </div>
                {missing.length > 0 && (
                  <p>
                    {missing.map(type => slotLabel(type, item?.program)).join(', ')}
                  </p>
                )}
              </section>
              {item.program?.steps?.length ? (
                <section>
                  <h3>{tr('Program adımları')}</h3>
                  <ol>
                    {item.program.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </section>
              ) : null}
              {item.program?.deadlines?.length ? (
                <section>
                  <h3>{tr('Önemli tarihler')}</h3>
                  {item.program.deadlines.map((d, i) => (
                    <p key={i}>
                      {d.label} · {formatDate(d.dateISO)}
                    </p>
                  ))}
                </section>
              ) : null}
              {item.program?.commonMistakes?.length ? (
                <section>
                  <h3>{tr('Dikkat edilecekler')}</h3>
                  <ul>
                    {item.program.commonMistakes.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <ProjectHealth id={id} />
              {action.feedback}
              {item.status === 'application_stage' &&
                item.decisionStatus !== 'rejected' &&
                !item.submittedAt && (
                  <button
                    className="primary"
                    disabled={
                      action.busy ||
                      !!missingProfile ||
                      !isEuropassCvComplete(fields?.europassCv) ||
                      !isMotivationLetterComplete(fields?.motivationLetter) ||
                      missing.length > 0
                    }
                    onClick={() =>
                      void action.run(async () =>
                        setItem(await api.submitApplication(id, item.revision)),
                      )
                    }
                  >
                    <ArrowRight size={16} /> {tr('Başvuruyu gönder')}
                  </button>
                )}
            </div>
          )}
          {(tab === 'cv' || tab === 'motivation') && (
            <DraftForm key={tab} kind={tab} item={item} onSaved={setItem} />
          )}
          {tab === 'messages' && <ThreadView threadId={id} />}
          {tab === 'documents' && (
            <MemberDocuments item={item} updated={() => retry(n => n + 1)} />
          )}
        </>
      )}
    </>
  );
}
function ProjectHealth({ id }: { id: string }) {
  const [state, setState] =
      useState<Awaited<ReturnType<typeof api.applicationBloodGroup>>>(),
    [value, setValue] = useState(''),
    [consent, setConsent] = useState(false),
    [error, setError] = useState('');
  const action = useAction();
  useEffect(() => {
    const c = new AbortController();
    api
      .applicationBloodGroup(id, c.signal)
      .then(s => {
        if (!c.signal.aborted) setState(s);
      })
      .catch(e => {
        if (!c.signal.aborted) setError(errorMessage(e));
      });
    return () => c.abort();
  }, [id]);
  if (error) return <Feedback error={error} />;
  if (!state?.available || state.consentVersion !== 'esc-blood-group-v1')
    return null;
  return (
    <section className="stack">
      <h3>{tr('Kan grubu · İsteğe bağlı')}</h3>
      {state.bloodGroup ? (
        <>
          <p>{state.bloodGroup}</p>
          <button
            className="secondary"
            disabled={action.busy}
            onClick={() =>
              void action.run(
                async () => setState(await api.revokeBloodGroup(id)),
                tr('Rızanız geri alındı.'),
              )
            }
          >
            {tr('Rızamı geri al')}
          </button>
        </>
      ) : (
        <>
          <label>
            {tr('Kan grubu')}
            <select value={value} onChange={e => setValue(e.target.value)}>
              <option value="">{tr('Seçin')}</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="choice">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
            />
            {tr(
              'Kan grubu bilgimin yalnız bu ESC projesinin başvuru ve hareketlilik işlemleri için kaydedilmesine ve yetkili inno yöneticilerince görülmesine açık rıza veriyorum. Paylaşmadan başvurabilirim ve rızamı burada geri alabilirim.',
            )}
          </label>
          <button
            className="secondary"
            disabled={!value || !consent || action.busy}
            onClick={() =>
              void action.run(async () => {
                setState(
                  await api.saveBloodGroup(id, value, state.consentVersion),
                );
                setValue('');
                setConsent(false);
              })
            }
          >
            {tr('Kan grubumu paylaş')}
          </button>
        </>
      )}
      {action.feedback}
    </section>
  );
}
function MemberDocuments({
  item,
  updated,
}: {
  item: Application;
  updated: () => void;
}) {
  const [history, setHistory] = useState(false),
    [preview, setPreview] = useState<Document>();
  const documents = useCollection(
    useCallback(
      () =>
        history
          ? api.documentHistory(item.id)
          : Promise.resolve(item.documents),
      [history, item],
    ),
  );
  const templates = useCollection(
    useCallback(() => api.templates(item.programId), [item.programId]),
  );
  const action = useAction();
  return (
    <div className="member-form">
      <section>
        <h3>{tr('Gerekli belgeler')}</h3>
        {item.program?.checklist.map((r, i) => (
          <p key={i}>
            <strong>{slotLabel(itemSlot(r), item.program)}</strong> ·{' '}
            {r.expectedFormat} {r.description}
          </p>
        ))}
        <p>
          {tr(
            'Gidiş ve dönüş biniş kartlarını ayrı yükleyin. Biniş kartlarının ve ıslak imza gerektiren belgelerin asıllarını elden teslim edin.',
          )}
        </p>
      </section>
      <section>
        <h3>{tr('Program şablonları')}</h3>
        <Feedback error={templates.error} />
        {templates.loading ? (
          <EmptyState loading />
        ) : !templates.error && !templates.items.length ? (
          <p>{tr('Bu programa şablon eklenmemiş.')}</p>
        ) : (
          templates.items.map(t => (
            <button
              className="secondary"
              key={t.id}
              disabled={action.busy}
              onClick={() =>
                void action.run(() => api.downloadTemplate(t.id, t.fileName))
              }
            >
              <Download size={16} />
              {DOCUMENTS[t.type] || t.fileName} {tr('indir')}
            </button>
          ))
        )}
        {action.feedback}
      </section>
      <section className="stack">
        <h3>{tr('Başvuru belgelerim')}</h3>
        {stageTypes(item).length > 0 && (
          <ApplicationDocumentUpload
            application={item}
            onUploaded={updated}
            allowScan
            allowedTypes={stageTypes(item)}
          />
        )}
        <label className="choice">
          <input
            type="checkbox"
            checked={history}
            onChange={e => setHistory(e.target.checked)}
          />{' '}
          {tr('Önceki sürümleri göster')}
        </label>
        {documents.loading ? (
          <EmptyState loading />
        ) : documents.error ? (
          <EmptyState title={tr('Belgeler alınamadı')} onRetry={documents.load}>
            {documents.error}
          </EmptyState>
        ) : !documents.items.length ? (
          <p>{tr('Henüz belge yüklenmemiş.')}</p>
        ) : (
          documents.items.map(d => (
            <div key={d.id} className="member-row">
              <span>
                <strong>
                  {documentLabel(d, item.program)} · v{d.version || 1}
                </strong>
                <small>
                  {d.fileName} · {documentStatus[d.status]}
                  {d.isCurrent === false ? ' ' + tr('· Önceki sürüm') + '' : ''}
                </small>
                {d.verifyNote && <small>{d.verifyNote}</small>}
                {d.physicalDeliveryStatus !== 'not_required' && (
                  <small>
                    {d.physicalDeliveryStatus === 'delivered'
                      ? tr('Elden teslim alındı')
                      : tr('Aslı bekleniyor')}
                  </small>
                )}
              </span>
              <button className="secondary small" onClick={() => setPreview(d)}>
                <Eye size={16} /> {tr('Aç')}
              </button>
            </div>
          ))
        )}
      </section>
      {preview && <Preview doc={preview} close={() => setPreview(undefined)} />}
    </div>
  );
}
function Preview({ doc, close }: { doc: Document; close: () => void }) {
  const [url, setUrl] = useState(''),
    [err, error] = useState('');
  useEffect(() => {
    let active = true,
      blobUrl = '';
    api
      .previewDocument(doc.id, doc.fileName)
      .then(v => {
        blobUrl = v.url;
        if (active) setUrl(v.url);
        else URL.revokeObjectURL(v.url);
      })
      .catch(e => {
        if (active) error(errorMessage(e));
      });
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [doc]);
  return (
    <Modal wide title={doc.fileName} onClose={close}>
      <div className="dialog-body">
        <Feedback error={err} />
        {url ? (
          doc.mimeType === 'application/pdf' ? (
            <iframe
              className="member-preview"
              title={doc.fileName}
              src={url + '#toolbar=0'}
            />
          ) : (
            <img className="member-preview" alt={doc.fileName} src={url} />
          )
        ) : (
          !err && <EmptyState loading />
        )}
      </div>
    </Modal>
  );
}
export function AccountSettings({
  user,
  changePassword,
  onDeleted,
}: {
  user: User;
  changePassword: () => void;
  onDeleted: () => void;
}) {
  const [mode, setMode] = useState<'' | 'email' | 'delete'>('');
  const action = useAction();
  return (
    <div className="member-form">
      <section>
        <h3>{tr('Hesabım')}</h3>
        <p>{user.email}</p>
        <div className="button-row">
          <button className="secondary" onClick={changePassword}>
            <KeyRound size={16} />
            {tr('Şifre değiştir')}
          </button>
          <button className="secondary" onClick={() => setMode('email')}>
            <Mail size={16} />
            {tr('E-postayı değiştir')}
          </button>
        </div>
      </section>
      <section className="stack">
        <h3>{tr('Gizlilik ve destek')}</h3>
        {[
          [
            tr('Gizlilik ve aydınlatma metni'),
            'https://api.innoder.org/privacy',
          ],
          [
            tr('Hesap silme talebi'),
            'https://api.innoder.org/account-deletion',
          ],
          [tr('İletişim ve destek'), 'https://api.innoder.org/support'],
          ...CONTACT_LINKS,
        ].map(([name, url]) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            {name}
          </a>
        ))}
      </section>
      <button className="secondary" onClick={() => setMode('delete')}>
        <Trash2 size={16} /> {tr('Hesap silme talebi')}
      </button>
      {!mode && action.feedback}
      {mode && (
        <Modal
          title={
            mode === 'email'
              ? tr('E-posta adresini değiştir')
              : tr('Hesap silme talebi')
          }
          busy={action.busy}
          onClose={() => setMode('')}
        >
          <div className="dialog-body">
            {action.feedback}
            {mode === 'email' ? (
              <form
                className="stack"
                onSubmit={e => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  void action.run(async () => {
                    await api.requestEmailChange(
                      String(d.get('email')),
                      String(d.get('password')),
                    );
                    setMode('');
                  }, tr('Yeni adrese doğrulama bağlantısı gönderildi.'));
                }}
              >
                <label>
                  {tr('Yeni e-posta')}
                  <input name="email" type="email" required />
                </label>
                <PasswordField
                  name="password"
                  autoComplete="current-password"
                  required
                />
                <button className="primary" disabled={action.busy}>
                  {tr('Doğrulama bağlantısı gönder')}
                </button>
              </form>
            ) : (
              <>
                <p>
                  {tr(
                    'Talebiniz yöneticilere iletilecek ve oturumunuz kapatılacak.',
                  )}
                </p>
                <div className="button-row">
                  <button className="secondary" onClick={() => setMode('')}>
                    {tr('Vazgeç')}
                  </button>
                  <button
                    className="primary"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await api.requestDeletion();
                        onDeleted();
                      })
                    }
                  >
                    {tr('Silme talebi gönder')}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
