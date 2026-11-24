import { translate as tr } from './locale';
import { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  History,
  KeyRound,
  LogOut,
  Menu,
  ShieldCheck,
  X,
  FolderKanban,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { api, memberPortal, SESSION_EXPIRED_EVENT } from './api';
import { MemberView, AccountSettings } from './member';
import { ContactRound, Settings } from 'lucide-react';
import { lockBodyScroll } from './scrollLock';
import { ApplicationsView } from './applications';
import { AuthScreen, ChangePasswordForm } from './auth';
import { AdminsView, AuditView, CandidatesView } from './management';
import {
  ProgramsView,
  MessagesView,
  DeletionRequestsView,
  confirmLeave,
} from './workflows';
import {
  Brand,
  EmptyState,
  errorMessage,
  Modal,
  Person,
  ThemeToggle,
} from './ui';
import type { User } from './types';
import { Users } from 'lucide-react';

type View =
  | 'applications'
  | 'candidates'
  | 'admins'
  | 'audit'
  | 'programs'
  | 'messages'
  | 'deletions'
  | 'profile'
  | 'settings';
const navigation: Array<{
  id: View;
  label: string;
  icon: typeof ClipboardList;
  superOnly?: boolean;
}> = [
  { id: 'applications', label: tr('Başvurular'), icon: ClipboardList },
  { id: 'candidates', label: tr('Adaylar'), icon: Users },
  { id: 'programs', label: tr('Programlar'), icon: FolderKanban },
  { id: 'messages', label: tr('Mesajlar'), icon: MessageSquare },
  { id: 'deletions', label: tr('Hesap silme talepleri'), icon: Trash2 },
  {
    id: 'admins',
    label: tr('Yönetici yönetimi'),
    icon: ShieldCheck,
    superOnly: true,
  },
  { id: 'audit', label: tr('İşlem kayıtları'), icon: History },
  { id: 'settings', label: tr('Ayarlar'), icon: Settings },
];
const memberNavigation: typeof navigation = [
  { id: 'applications', label: tr('Programlarım'), icon: FolderKanban },
  { id: 'profile', label: tr('Kişisel bilgilerim'), icon: ContactRound },
  { id: 'messages', label: tr('Mesajlarım'), icon: MessageSquare },
  { id: 'settings', label: tr('Ayarlar'), icon: Settings },
];

export const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('applications');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(api.hasSession());
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState('');
  const [startupError, setStartupError] = useState('');
  const [startupAttempt, setStartupAttempt] = useState(0);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let current = true;
    if (api.hasSession()) {
      setLoading(true);
      setStartupError('');
      api
        .me()
        .then(account => {
          if (!current) return;
          if (memberPortal !== (account.role === 'candidate')) {
            api.clearSession();
            throw new Error(tr('Bu hesap bu giriş alanı için yetkili değil.'));
          }
          if (current) setUser(account);
        })
        .catch(cause => {
          if (!current) return;
          if (api.hasSession()) setStartupError(errorMessage(cause));
          else setNotice(errorMessage(cause));
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }
    const expired = () => {
      setUser(null);
      setPasswordOpen(false);
      setSidebarOpen(false);
      setStartupError('');
      setNotice(tr('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'));
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    return () => {
      current = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
    };
  }, [startupAttempt]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const unlock = lockBodyScroll();
    if (mainRef.current) mainRef.current.inert = true;
    sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
      if (event.key === 'Tab') {
        const focusable = Array.from(
          sidebarRef.current?.querySelectorAll<HTMLButtonElement>(
            'button:not(:disabled)',
          ) || [],
        );
        if (event.shiftKey && document.activeElement === focusable[0]) {
          event.preventDefault();
          focusable.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === focusable.at(-1)
        ) {
          event.preventDefault();
          focusable[0]?.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth > 900) setSidebarOpen(false);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    return () => {
      unlock();
      if (mainRef.current) mainRef.current.inert = false;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', resize);
      menuButton.current?.focus();
    };
  }, [sidebarOpen]);

  const passwordChanged = () => {
    api.clearSession();
    setUser(null);
    setPasswordOpen(false);
    setNotice(
      tr('Şifreniz değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.'),
    );
  };
  if (loading)
    return (
      <div className="center-state">
        <EmptyState loading />
      </div>
    );
  if (startupError)
    return (
      <div className="center-state">
        <div>
          <EmptyState
            title={tr('Oturum doğrulanamadı')}
            onRetry={() => setStartupAttempt(value => value + 1)}
          >
            {startupError}
          </EmptyState>
          <button
            className="secondary full"
            onClick={() => {
              api.clearSession();
              setStartupError('');
            }}
          >
            {tr('Giriş ekranına dön')}
          </button>
        </div>
      </div>
    );
  if (!user)
    return (
      <AuthScreen
        notice={notice}
        onLogin={account => {
          setUser(account);
          setView('applications');
          setNotice('');
        }}
      />
    );
  if (user.mustChangePassword)
    return (
      <div className="auth-layout">
        <div className="auth-top">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="auth-form">
          <span className="section-eyebrow">{tr('HESAP GÜVENLİĞİ')}</span>
          <h1>{tr('Yeni şifrenizi belirleyin')}</h1>
          <ChangePasswordForm
            username={user.username || user.email}
            forced
            onComplete={passwordChanged}
          />
        </div>
      </div>
    );

  const isMember = user.role === 'candidate';
  const items = isMember ? memberNavigation : navigation;
  const activeView = items.find(item => item.id === view)!;
  const roleLabel = isMember
    ? tr('Üye')
    : user.role === 'super_admin'
    ? tr('Süper yönetici')
    : tr('Yönetici');
  return (
    <div className={`shell${sidebarOpen ? ' menu-open' : ''}`}>
      <a className="skip-link" href="#main-content">
        {tr('İçeriğe geç')}
      </a>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
        aria-label={tr('Ana menü')}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            title={tr('Menüyü kapat')}
            aria-label={tr('Menüyü kapat')}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <span className="nav-caption">{tr('Çalışma alanı')}</span>
        <nav aria-label={isMember ? tr('Üye menüsü') : tr('Yönetim')}>
          {items
            .filter(item => !item.superOnly || user.role === 'super_admin')
            .map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-item${view === id ? ' active' : ''}`}
                aria-current={view === id ? 'page' : undefined}
                onClick={() => {
                  if (view !== id && !confirmLeave()) return;
                  setView(id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
        </nav>
        <div className="account-block">
          <Person name={user.name} detail={roleLabel} />
          <div className="account-actions">
            <button
              className="icon-button"
              title={tr('Şifre değiştir')}
              aria-label={tr('Şifre değiştir')}
              onClick={() => {
                setSidebarOpen(false);
                setPasswordOpen(true);
              }}
            >
              <KeyRound size={18} />
            </button>
            <button
              className="text-button"
              disabled={loggingOut}
              onClick={async () => {
                if (!confirmLeave()) return;
                setLoggingOut(true);
                try {
                  await api.logout();
                } catch {
                  /* Local session is cleared even when logout is offline. */
                } finally {
                  if (!api.hasSession()) {
                    setUser(null);
                    setSidebarOpen(false);
                  }
                  setLoggingOut(false);
                }
              }}
            >
              <LogOut size={17} />
              {loggingOut ? tr('Çıkılıyor…') : tr('Çıkış yap')}
            </button>
          </div>
        </div>
      </aside>
      <main ref={mainRef}>
        <header className="topbar">
          <button
            ref={menuButton}
            className="icon-button mobile-only"
            title={tr('Menüyü aç')}
            aria-label={tr('Menüyü aç')}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>{isMember ? tr('Üye alanı') : tr('Yönetim')}</span>
            <span aria-hidden="true">/</span>
            <strong>{activeView.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="role-badge">
              <ShieldCheck size={14} />
              {roleLabel}
            </span>
            <ThemeToggle />
          </div>
        </header>
        <div id="main-content" className="content" tabIndex={-1}>
          <header className="page-heading">
            <span className="section-eyebrow">Inno Derneği</span>
            <h1>{activeView.label}</h1>
          </header>
          {view === 'settings' ? (
            <AccountSettings
              user={user}
              changePassword={() => setPasswordOpen(true)}
              onDeleted={() => {
                api.clearSession();
                setUser(null);
                setNotice(tr('Hesap silme talebiniz alındı.'));
              }}
            />
          ) : isMember ? (
            <MemberView
              key={user.id}
              view={view}
              user={user}
              setUser={setUser}
              goProfile={() => {
                if (confirmLeave()) setView('profile');
              }}
            />
          ) : (
            <>
              {view === 'applications' && <ApplicationsView />}
              {view === 'candidates' && <CandidatesView />}
              {view === 'admins' && user.role === 'super_admin' && (
                <AdminsView currentUserId={user.id} />
              )}
              {view === 'audit' && <AuditView />}
              {view === 'programs' && <ProgramsView />}
              {view === 'messages' && <MessagesView />}
              {view === 'deletions' && <DeletionRequestsView />}
            </>
          )}
        </div>
      </main>
      {passwordOpen && (
        <Modal
          title={tr('Şifre değiştir')}
          onClose={() => setPasswordOpen(false)}
        >
          <div className="dialog-body">
            <ChangePasswordForm
              username={user.username || user.email}
              onComplete={passwordChanged}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
