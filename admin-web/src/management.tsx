import { translate as tr } from './locale';
import { useCallback, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  History,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { api } from './api';
import {
  AUDIT_ACTIONS,
  ENTITIES,
  formatDate,
  matches,
  passwordHint,
  USER_STATUS,
  validPassword,
} from './domain';
import { useCollection } from './hooks';
import { usePage } from './usePage';
import {
  EmptyState,
  errorMessage,
  EventLink,
  Feedback,
  Modal,
  PAGE_SIZE,
  Pagination,
  PasswordField,
  Person,
  SearchField,
} from './ui';
import type { User } from './types';

const Status = ({ status }: { status: string }) => (
  <span
    className={`badge ${
      status === 'active'
        ? 'active'
        : status.startsWith('pending')
        ? 'application_stage'
        : 'neutral'
    }`}
  >
    {USER_STATUS[status] || status}
  </span>
);
/** Every status the users table allows; the filter must not depend on the visible page. */
export const CANDIDATE_STATUSES = [
  'pending',
  'active',
  'disabled',
  'deletion_requested',
  'anonymized',
] as const;
const safePage = (page: number, total: number) =>
  Math.min(page, Math.max(0, Math.ceil(total / PAGE_SIZE) - 1));

export const CandidatesView = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [candidate, setCandidate] = useState<User>();
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const { items, loading, error, load, total } = usePage(
    useCallback(
      () =>
        api.candidatePage(
          new URLSearchParams({
            page: String(page + 1),
            pageSize: String(PAGE_SIZE),
            q: query,
            ...(status ? { status } : {}),
          }),
        ),
      [page, query, status],
    ),
  );
  const filtered = items;
  const currentPage = page;
  return (
    <>
      <div className="list-heading">
        <h2>
          {tr('Aday kayıtları')} <span className="count">{total}</span>
        </h2>
        <button
          className="icon-button"
          title={tr('Adayları yenile')}
          aria-label={tr('Adayları yenile')}
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
      <section className="toolbar">
        <SearchField
          value={query}
          onChange={value => {
            setQuery(value);
            setPage(0);
          }}
        />
        <select
          aria-label={tr('Aday durumu filtresi')}
          value={status}
          onChange={e => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">{tr('Tüm durumlar')}</option>
          {CANDIDATE_STATUSES.map(value => (
            <option value={value} key={value}>
              {USER_STATUS[value] || value}
            </option>
          ))}
        </select>
      </section>
      <Feedback error={error} success={success} />
      <div
        className="table-wrap"
        role="region"
        aria-label={tr('Aday listesi')}
        tabIndex={0}
        aria-busy={loading}
      >
        <table>
          <thead>
            <tr>
              <th>{tr('Aday')}</th>
              <th>{tr('Durum')}</th>
              <th>{tr('Etkinlik bağlantısı')}</th>
              <th>{tr('Kayıt tarihi')}</th>
              <th>
                <span className="sr-only">{tr('İşlemler')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    loading={loading}
                    title={
                      error ? tr('Adaylar yüklenemedi') : tr('Aday bulunamadı')
                    }
                    onRetry={error ? () => void load() : undefined}
                  />
                </td>
              </tr>
            )}
            {filtered.map(item => (
              <tr key={item.id}>
                <td>
                  <Person name={item.name} detail={item.email} />
                  <a
                    className="table-link"
                    href={`mailto:${item.email}`}
                  >
                    {tr('E-posta gönder')}
                  </a>
                </td>
                <td>
                  <Status status={item.status} />
                </td>
                <td>
                  <EventLink value={item.eventLink} />
                </td>
                <td className="date-cell">
                  {formatDate(item.createdAt)}
                  {item.credentialRequestedAt && (
                    <small className="muted block">
                      {tr('Şifre talebi')}:{' '}
                      {formatDate(item.credentialRequestedAt)}
                    </small>
                  )}
                </td>
                <td className="action-cell">
                  <button
                    className="secondary small"
                    disabled={['anonymized', 'deletion_requested'].includes(
                      item.status,
                    )}
                    onClick={() => setCandidate(item)}
                  >
                    <KeyRound size={16} /> {tr('Geçici şifre')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} total={total} onChange={setPage} />
      {candidate && (
        <TemporaryPassword
          user={candidate}
          onClose={() => setCandidate(undefined)}
          requireEventLinkApproval={candidate.status === 'pending'}
          onSave={password =>
            api.setTemporaryPassword(
              candidate.id,
              password,
              candidate.status === 'pending' ? true : undefined,
            )
          }
          onSaved={() => {
            setCandidate(undefined);
            setSuccess(
              tr(
                'Geçici şifre kaydedildi. Aday ilk girişinde şifresini değiştirecek.',
              ),
            );
            void load();
          }}
        />
      )}
    </>
  );
};

export const AdminsView = ({ currentUserId }: { currentUserId: string }) => {
  const { items, loading, error, load } = useCollection(api.admins);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User>();
  const [statusUser, setStatusUser] = useState<User>();
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const filtered = items.filter(item =>
    matches(query, item.name, item.email, item.username),
  );
  const currentPage = safePage(page, filtered.length);
  return (
    <>
      <div className="list-heading">
        <h2>
          {tr('Yetkili hesaplar')} <span className="count">{items.length}</span>
        </h2>
        <div className="button-row">
          <button
            className="icon-button"
            title={tr('Yöneticileri yenile')}
            aria-label={tr('Yöneticileri yenile')}
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <button className="primary" onClick={() => setShowForm(true)}>
            <UserPlus size={17} /> {tr('Yönetici ekle')}
          </button>
        </div>
      </div>
      <section className="toolbar">
        <SearchField
          value={query}
          onChange={value => {
            setQuery(value);
            setPage(0);
          }}
        />
      </section>
      <Feedback error={error} success={success} />
      <div
        className="table-wrap"
        role="region"
        aria-label={tr('Yönetici listesi')}
        tabIndex={0}
        aria-busy={loading}
      >
        <table>
          <thead>
            <tr>
              <th>{tr('Yönetici')}</th>
              <th>{tr('Kullanıcı adı')}</th>
              <th>{tr('Rol')}</th>
              <th>{tr('Durum')}</th>
              <th>
                <span className="sr-only">{tr('İşlemler')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    loading={loading}
                    title={
                      error
                        ? tr('Yöneticiler yüklenemedi')
                        : tr('Yönetici bulunamadı')
                    }
                    onRetry={error ? () => void load() : undefined}
                  />
                </td>
              </tr>
            )}
            {filtered
              .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
              .map(admin => (
                <tr key={admin.id}>
                  <td>
                    <Person name={admin.name} detail={admin.email} />
                  </td>
                  <td>{admin.username || '—'}</td>
                  <td>
                    <span className="role-label">
                      <ShieldCheck size={15} />
                      {admin.role === 'super_admin'
                        ? tr('Süper yönetici')
                        : tr('Yönetici')}
                    </span>
                  </td>
                  <td>
                    <Status status={admin.status} />
                  </td>
                  <td className="action-cell">
                    <div className="button-row">
                      {admin.id === currentUserId ? (
                        <span className="muted">{tr('Sizin hesabınız')}</span>
                      ) : (
                        <>
                          <button
                            className="icon-button"
                            title={`${admin.name} şifresini sıfırla`}
                            aria-label={`${admin.name} şifresini sıfırla`}
                            onClick={() => setPasswordUser(admin)}
                          >
                            <KeyRound size={17} />
                          </button>
                          {admin.role !== 'super_admin' && (
                            <button
                              className="secondary small"
                              onClick={() => setStatusUser(admin)}
                            >
                              {admin.status === 'active'
                                ? tr('Pasifleştir')
                                : tr('Etkinleştir')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        total={filtered.length}
        onChange={setPage}
      />
      {showForm && (
        <AdminForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setSuccess(tr('Yönetici hesabı oluşturuldu.'));
            void load();
          }}
        />
      )}
      {passwordUser && (
        <TemporaryPassword
          user={passwordUser}
          onClose={() => setPasswordUser(undefined)}
          onSave={password => api.resetAdminPassword(passwordUser.id, password)}
          onSaved={() => {
            setPasswordUser(undefined);
            setSuccess(tr('Geçici şifre kaydedildi.'));
            void load();
          }}
        />
      )}
      {statusUser && (
        <StatusConfirmation
          user={statusUser}
          onClose={() => setStatusUser(undefined)}
          onSaved={() => {
            setStatusUser(undefined);
            setSuccess(tr('Yönetici durumu güncellendi.'));
            void load();
          }}
        />
      )}
    </>
  );
};

const TemporaryPassword = ({
  user,
  onClose,
  onSave,
  onSaved,
  requireEventLinkApproval = false,
}: {
  user: User;
  onClose: () => void;
  onSave: (value: string) => Promise<unknown>;
  onSaved: () => void;
  requireEventLinkApproval?: boolean;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const hasLink = Boolean(user.eventLink);
  const blocked = requireEventLinkApproval && (!hasLink || !approved);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (blocked) {
      setError(
        hasLink
          ? tr('Önce etkinlik bağlantısını kontrol edip onaylayın.')
          : tr(
              'Aday etkinlik bağlantısı paylaşmadığı için hesap etkinleştirilemez.',
            ),
      );
      return;
    }
    if (!validPassword(password)) {
      setError(passwordHint);
      return;
    }
    setBusy(true);
    try {
      await onSave(password);
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={tr('Geçici şifre belirle')}
      subtitle={user.name}
      onClose={onClose}
      busy={busy}
    >
      <form className="dialog-body stack" onSubmit={submit}>
        <p className="form-note">
          {user.role === 'candidate' && user.status !== 'active'
            ? '' +
              tr(
                'Şifre kaydedildiğinde aday hesabı onaylanarak etkinleştirilecek.',
              ) +
              ' '
            : ''}
          {tr(
            'Mevcut oturumlar kapatılacak. İlk girişte yeni şifre belirlenmesi gerekecek.',
          )}
        </p>
        {requireEventLinkApproval && (
          <section className="approval-box stack">
            <strong>{tr('Etkinlik bağlantısı')}</strong>
            <EventLink value={user.eventLink} />
            {hasLink ? (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={approved}
                  disabled={busy}
                  onChange={e => setApproved(e.target.checked)}
                />
                {tr(
                  'Bağlantıyı açıp kontrol ettim; aday bu etkinliğe katılıyor.',
                )}
              </label>
            ) : (
              <p className="form-note">
                {tr(
                  'Aday etkinlik bağlantısı paylaşmadığı için hesap etkinleştirilemez.',
                )}
              </p>
            )}
          </section>
        )}
        <Feedback error={error} />
        <input autoComplete="username" value={user.email} readOnly hidden />
        <PasswordField
          label={tr('Geçici şifre')}
          hint={passwordHint}
          minLength={12}
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={busy}
        />
        <footer className="dialog-footer">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            {tr('Vazgeç')}
          </button>
          <button className="primary" disabled={busy || blocked}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <KeyRound size={17} />
            )}
            {busy
              ? tr('Kaydediliyor…')
              : requireEventLinkApproval
              ? tr('Onayla ve şifreyi kaydet')
              : tr('Şifreyi kaydet')}
          </button>
        </footer>
      </form>
    </Modal>
  );
};

const AdminForm = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    temporaryPassword: '',
    role: 'admin',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (field: keyof typeof form, value: string) =>
    setForm(current => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validPassword(form.temporaryPassword)) {
      setError(passwordHint);
      return;
    }
    setBusy(true);
    try {
      await api.createAdmin({
        ...form,
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
      });
      onCreated();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={tr('Yeni yönetici')} onClose={onClose} busy={busy}>
      <form className="dialog-body stack" onSubmit={submit}>
        <Feedback error={error} />
        <label>
          {tr('Ad soyad')}
          <input
            minLength={2}
            maxLength={160}
            required
            autoComplete="name"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          {tr('E-posta')}
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          {tr('Kullanıcı adı')}
          <input
            minLength={3}
            maxLength={80}
            required
            autoCapitalize="none"
            autoComplete="username"
            value={form.username}
            onChange={e => update('username', e.target.value)}
            disabled={busy}
          />
        </label>
        <PasswordField
          label={tr('Geçici şifre')}
          hint={passwordHint}
          required
          autoComplete="new-password"
          minLength={12}
          value={form.temporaryPassword}
          onChange={e => update('temporaryPassword', e.target.value)}
          disabled={busy}
        />
        <label>
          {tr('Yetki')}
          <select
            value={form.role}
            onChange={e => update('role', e.target.value)}
            disabled={busy}
          >
            <option value="admin">{tr('Yönetici')}</option>
            <option value="super_admin">{tr('Süper yönetici')}</option>
          </select>
        </label>
        {form.role === 'super_admin' && (
          <p className="form-note">
            {tr(
              'Süper yöneticiler yeni yönetici ekleyebilir ve hesap yetkilerini değiştirebilir.',
            )}
          </p>
        )}
        <footer className="dialog-footer">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            {tr('Vazgeç')}
          </button>
          <button className="primary" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <UserPlus size={17} />
            )}
            {busy ? tr('Oluşturuluyor…') : tr('Yönetici oluştur')}
          </button>
        </footer>
      </form>
    </Modal>
  );
};

const StatusConfirmation = ({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const disable = user.status === 'active';
  return (
    <Modal
      title={
        disable
          ? tr('Yönetici hesabı pasifleştirilsin mi?')
          : tr('Yönetici hesabı etkinleştirilsin mi?')
      }
      subtitle={user.name}
      onClose={onClose}
      busy={busy}
    >
      <div className="dialog-body stack">
        <p className="form-note">
          {disable
            ? tr(
                'Bu hesabın açık oturumları kapatılır ve yönetim erişimi durdurulur.',
              )
            : tr('Bu hesabın yönetim erişimi yeniden açılır.')}
        </p>
        <Feedback error={error} />
        <footer className="dialog-footer">
          <button className="secondary" onClick={onClose} disabled={busy}>
            {tr('Vazgeç')}
          </button>
          <button
            className={disable ? 'danger' : 'primary'}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await api.setAdminStatus(
                  user.id,
                  disable ? 'disabled' : 'active',
                );
                onSaved();
              } catch (cause) {
                setError(errorMessage(cause));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}
            {disable ? tr('Pasifleştir') : tr('Etkinleştir')}
          </button>
        </footer>
      </div>
    </Modal>
  );
};

export const AuditView = () => {
  const { items, loading, error, load } = useCollection(api.audit);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const filtered = items.filter(log =>
    matches(
      query,
      AUDIT_ACTIONS[log.action],
      log.action,
      ENTITIES[log.entityType],
      log.actorUserId,
      log.entityId,
    ),
  );
  const currentPage = safePage(page, filtered.length);
  return (
    <>
      <div className="list-heading">
        <h2>
          {tr('Son işlemler')} <span className="count">{items.length}</span>
        </h2>
        <button
          className="icon-button"
          title={tr('İşlem kayıtlarını yenile')}
          aria-label={tr('İşlem kayıtlarını yenile')}
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
      <section className="toolbar">
        <SearchField
          value={query}
          onChange={value => {
            setQuery(value);
            setPage(0);
          }}
          placeholder={tr('İşlem veya kayıt kimliği ara')}
        />
        <span className="muted">{tr('En son 200 kayıt')}</span>
      </section>
      <Feedback error={error} />
      <div
        className="table-wrap"
        role="region"
        aria-label={tr('İşlem kayıtları')}
        tabIndex={0}
        aria-busy={loading}
      >
        <table>
          <thead>
            <tr>
              <th>{tr('İşlem')}</th>
              <th>{tr('Kayıt')}</th>
              <th>{tr('İşlemi yapan')}</th>
              <th>{tr('Tarih')}</th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    loading={loading}
                    title={
                      error
                        ? tr('İşlem kayıtları yüklenemedi')
                        : tr('İşlem bulunamadı')
                    }
                    onRetry={error ? () => void load() : undefined}
                  />
                </td>
              </tr>
            )}
            {filtered
              .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
              .map(log => (
                <tr key={log.id}>
                  <td>
                    <div className="audit-action">
                      <History size={17} />
                      <strong>{AUDIT_ACTIONS[log.action] || log.action}</strong>
                    </div>
                  </td>
                  <td>
                    {ENTITIES[log.entityType] || log.entityType}
                    <small title={log.entityId}>
                      {log.entityId?.slice(0, 8) || '—'}
                    </small>
                  </td>
                  <td>
                    <span className="mono" title={log.actorUserId}>
                      {log.actorUserId?.slice(0, 8) || tr('Sistem')}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        total={filtered.length}
        onChange={setPage}
      />
    </>
  );
};
