import { translate as tr } from './locale';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react';
import { api, memberPortal } from './api';
import { passwordHint, validPassword } from './domain';
import {
  Brand,
  ContactLinks,
  errorMessage,
  Feedback,
  PasswordField,
  ThemeToggle,
} from './ui';
import type { User } from './types';

export const AuthScreen = ({
  onLogin,
  notice,
}: {
  onLogin: (user: User) => void;
  notice?: string;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (forgot) {
        await api.forgotPassword(email.trim());
        setSuccess(
          tr(
            'E-posta adresiniz kayıtlıysa şifre yenileme bağlantısı gönderilecektir.',
          ),
        );
      } else onLogin(await api.login(email.trim(), password, remember));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  const switchMode = () => {
    setForgot(!forgot);
    setError('');
    setSuccess('');
    setPassword('');
  };
  return (
    <div className="auth-layout">
      <div className="auth-top">
        <Brand />
        <ThemeToggle />
      </div>
      <div className="auth-form">
        <h1>
          {register
            ? tr('Üyelik başvurusu')
            : forgot
            ? tr('Şifrenizi yenileyin')
            : memberPortal
            ? tr('Üye girişi')
            : tr('Yönetici girişi')}
        </h1>
        {register ? (
          <Registration
            back={() => setRegister(false)}
            done={message => {
              setRegister(false);
              setSuccess(message);
            }}
          />
        ) : (
          <>
            <form onSubmit={submit}>
              <Feedback success={success || notice} error={error} />
              <label>
                {forgot
                  ? tr('E-posta adresi')
                  : tr('E-posta veya kullanıcı adı')}
                <input
                  type={forgot ? 'email' : 'text'}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                  disabled={busy}
                />
              </label>
              {!forgot && (
                <PasswordField
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  disabled={busy}
                />
              )}
              {!forgot && (
                <div className="form-link">
                  {api.canRemember() && (
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={remember}
                        disabled={busy}
                        onChange={event => setRemember(event.target.checked)}
                      />
                      {tr('Beni hatırla')}
                    </label>
                  )}
                  <button
                    type="button"
                    className="text-button"
                    onClick={switchMode}
                    disabled={busy}
                  >
                    {tr('Şifremi unuttum')}
                  </button>
                </div>
              )}
              <button className="primary full" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
                {busy
                  ? tr('Lütfen bekleyin…')
                  : forgot
                  ? tr('Yenileme bağlantısı gönder')
                  : tr('Giriş yap')}
              </button>
              {forgot && (
                <button
                  type="button"
                  className="text-button back-login"
                  onClick={switchMode}
                  disabled={busy}
                >
                  <ArrowLeft size={17} /> {tr('Girişe dön')}
                </button>
              )}
            </form>
            {memberPortal && !forgot && (
              <button
                className="text-button back-login"
                disabled={busy}
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setRegister(true);
                }}
              >
                {tr('Üyelik başvurusu yap')}
              </button>
            )}
          </>
        )}
        {memberPortal && <ContactLinks />}
        <footer className="auth-footer">
          inno derneği ·{' '}
          {memberPortal ? tr('Üye erişimi') : tr('Yönetici erişimi')}
        </footer>
      </div>
    </div>
  );
};

const Registration = ({
  back,
  done,
}: {
  back: () => void;
  done: (message: string) => void;
}) => {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <form
      className="stack"
      onSubmit={async e => {
        e.preventDefault();
        if (busy) return;
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError('');
        try {
          const result = await api.registerCandidate({
            name: String(form.get('name')).trim(),
            email: String(form.get('email')).trim(),
            eventLink: String(form.get('eventLink')).trim(),
            noticeAccepted: form.has('notice'),
            consentAccepted: form.has('consent'),
          });
          done(result.message);
        } catch (cause) {
          setError(errorMessage(cause));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {tr('Ad soyad')}
        <input
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={160}
          required
        />
      </label>
      <label>
        {tr('E-posta adresi')}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {tr('Etkinlik bağlantısı')}
        <input name="eventLink" type="url" maxLength={500} required />
      </label>
      <a
        href="https://api.innoder.org/privacy"
        target="_blank"
        rel="noreferrer"
      >
        {tr('Aydınlatma metnini oku')}
      </a>
      <label className="choice">
        <input type="checkbox" name="notice" required />{' '}
        {tr('Aydınlatma metnini okudum.')}
      </label>
      <label className="choice">
        <input type="checkbox" name="consent" required />{' '}
        {tr(
          'Başvuru bilgilerimin belirtilen amaçlarla işlenmesini kabul ediyorum.',
        )}
      </label>
      <Feedback error={error} />
      <button className="primary" disabled={busy}>
        {tr('Kayıt talebi gönder')}
      </button>
      <button
        type="button"
        className="text-button"
        onClick={back}
        disabled={busy}
      >
        {tr('Girişe dön')}
      </button>
    </form>
  );
};

export const ChangePasswordForm = ({
  username,
  forced = false,
  onComplete,
}: {
  username: string;
  forced?: boolean;
  onComplete: () => void;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmation) {
      setError(tr('Yeni şifreler eşleşmiyor.'));
      return;
    }
    if (!validPassword(newPassword)) {
      setError(passwordHint);
      return;
    }
    if (newPassword === currentPassword) {
      setError(tr('Yeni şifreniz mevcut şifrenizden farklı olmalıdır.'));
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      onComplete();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <input autoComplete="username" value={username} readOnly hidden />
      <Feedback error={error} />
      <PasswordField
        label={forced ? tr('Geçici şifre') : tr('Mevcut şifre')}
        autoComplete="current-password"
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        required
        disabled={busy}
      />
      <PasswordField
        label={tr('Yeni şifre')}
        hint={passwordHint}
        autoComplete="new-password"
        minLength={12}
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        required
        disabled={busy}
      />
      <PasswordField
        label={tr('Yeni şifre tekrar')}
        autoComplete="new-password"
        minLength={12}
        value={confirmation}
        onChange={e => setConfirmation(e.target.value)}
        required
        disabled={busy}
      />
      <button className="primary full" disabled={busy}>
        {busy && <LoaderCircle size={18} className="spin" />}{' '}
        {busy ? tr('Kaydediliyor…') : tr('Şifreyi değiştir')}
      </button>
    </form>
  );
};
