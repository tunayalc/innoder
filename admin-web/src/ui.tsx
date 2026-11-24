import { language, translate as tr } from './locale';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Inbox,
  LoaderCircle,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { lockBodyScroll } from './scrollLock';
import { memberPortal } from './api';

export const Brand = () => (
  <div className="brand">
    <img
      src="/inno-wordmark.png"
      alt={tr('Inno Derneği logosu')}
      width="124"
      height="58"
    />
    <div>
      <strong>Inno Derneği</strong>
      <span>{memberPortal ? tr('Üye alanı') : tr('Yönetim sistemi')}</span>
    </div>
  </div>
);

export const ThemeToggle = () => {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('inno_theme', next ? 'dark' : 'light');
    } catch {
      /* Storage can be unavailable in private contexts. */
    }
    setDark(next);
  };
  return (
    <div className="display-controls">
      <select
        aria-label={tr('Dil')}
        value={language}
        onChange={event => {
          if (
            !window.dispatchEvent(
              new Event('inno:before-leave', { cancelable: true }),
            )
          )
            return;
          const next = event.target.value;
          try {
            localStorage.setItem('inno_lang', next);
          } catch {
            /* The URL also works without storage. */
          }
          const url = new URL(window.location.href);
          url.searchParams.set('lang', next);
          window.location.assign(url.href);
        }}
      >
        <option value="tr" lang="tr">
          TR
        </option>
        <option value="en" lang="en">
          EN
        </option>
      </select>
      <button
        type="button"
        className="icon-button"
        title={dark ? tr('Açık tema') : tr('Koyu tema')}
        aria-label={dark ? tr('Açık tema') : tr('Koyu tema')}
        onClick={toggle}
      >
        {dark ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
};

export const Feedback = ({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) => (
  <>
    {error && (
      <div className="feedback error" role="alert">
        <AlertCircle size={18} />
        <span>{tr(error)}</span>
      </div>
    )}
    {success && (
      <div className="feedback success" role="status">
        <CheckCircle2 size={18} />
        <span>{tr(success)}</span>
      </div>
    )}
  </>
);

export const EmptyState = ({
  loading = false,
  title = tr('Kayıt bulunamadı'),
  children,
  onRetry,
}: {
  loading?: boolean;
  title?: string;
  children?: ReactNode;
  onRetry?: () => void;
}) => (
  <div className="empty-state" role="status">
    {loading ? (
      <LoaderCircle className="spin" size={28} />
    ) : (
      <Inbox size={30} />
    )}
    <strong>{loading ? tr('Yükleniyor…') : title}</strong>
    {!loading && children && <span>{children}</span>}
    {!loading && onRetry && (
      <button className="secondary" onClick={onRetry}>
        {tr('Tekrar dene')}
      </button>
    )}
  </div>
);

export const PasswordField = ({
  label = tr('Şifre'),
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
}) => {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="icon-button bare"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? tr('Şifreyi gizle') : tr('Şifreyi göster')}
          title={visible ? tr('Şifreyi gizle') : tr('Şifreyi göster')}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
};

export const SearchField = ({
  value,
  onChange,
  placeholder = tr('Ad veya e-posta ara'),
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="search">
    <Search size={18} aria-hidden="true" />
    <input
      type="search"
      aria-label={placeholder}
      placeholder={placeholder}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    {value && (
      <button
        type="button"
        className="icon-button bare"
        title={tr('Aramayı temizle')}
        aria-label={tr('Aramayı temizle')}
        onClick={() => onChange('')}
      >
        <X size={16} />
      </button>
    )}
  </div>
);

// Native dialogs provide focus containment, Escape handling and inert background content.
export const Modal = ({
  title,
  subtitle,
  onClose,
  children,
  drawer = false,
  busy = false,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  drawer?: boolean;
  busy?: boolean;
  wide?: boolean;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    element?.showModal();
    return () => {
      element?.close();
      unlock();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${drawer ? 'drawer' : 'modal'}${wide ? ' wide' : ''}`}
      aria-labelledby={id}
      onCancel={event => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onClose();
      }}
      onClick={event => {
        if (!busy && event.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <header className="dialog-header">
        <div>
          {subtitle && <small>{subtitle}</small>}
          <h2 id={id}>{title}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={tr('Kapat')}
          title={tr('Kapat')}
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
};

export const PAGE_SIZE = 25;
export const Pagination = ({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <footer className="table-footer">
      <span role="status">
        {total
          ? `${page * PAGE_SIZE + 1}–${Math.min(
              (page + 1) * PAGE_SIZE,
              total,
            )} / ${total} ${tr('kayıt')}`
          : tr('0 kayıt')}
      </span>
      <div className="pager">
        <button
          className="icon-button"
          title={tr('Önceki sayfa')}
          aria-label={tr('Önceki sayfa')}
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          {page + 1} / {pages}
        </span>
        <button
          className="icon-button"
          title={tr('Sonraki sayfa')}
          aria-label={tr('Sonraki sayfa')}
          disabled={page + 1 >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </footer>
  );
};

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toLocaleUpperCase('tr');
export const Person = ({ name, detail }: { name: string; detail?: string }) => (
  <div className="person">
    <span className="avatar" aria-hidden="true">
      {initials(name)}
    </span>
    <div>
      <strong>{name}</strong>
      {detail && <small>{detail}</small>}
    </div>
  </div>
);
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : tr('İşlem tamamlanamadı. Lütfen tekrar deneyin.');
