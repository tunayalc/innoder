import { translate as tr } from './locale';
import { useEffect, useState } from 'react';
import { ClipboardList, FileWarning, MessageSquare, UserCheck } from 'lucide-react';
import { api } from './api';

type Counts = { pending?: number; issues?: number; unread?: number; total?: number };
type Target = 'candidates' | 'messages' | 'applications';

// Admin home strip: greeting plus the four numbers an admin acts on first.
export function AdminOverview({ name, open }: { name: string; open: (view: Target) => void }) {
  const [counts, setCounts] = useState<Counts>({});
  useEffect(() => {
    let current = true;
    const page = (extra: Record<string, string>) => new URLSearchParams({ page: '1', pageSize: '1', ...extra });
    const settle = <T,>(promise: Promise<T>, pick: (value: T) => number, key: keyof Counts) =>
      promise
        .then(value => {
          if (current) setCounts(prev => ({ ...prev, [key]: pick(value) }));
        })
        .catch(() => undefined);
    void settle(api.candidatePage(page({ status: 'pending' })), value => value.total, 'pending');
    void settle(api.applicationPage(page({ hasIssues: 'true' })), value => value.total, 'issues');
    void settle(api.applicationPage(page({})), value => value.total, 'total');
    void settle(api.unread(), value => value.unread, 'unread');
    return () => {
      current = false;
    };
  }, []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? tr('Günaydın') : hour < 18 ? tr('İyi günler') : tr('İyi akşamlar');
  const cards: Array<{ key: keyof Counts; label: string; hint: string; icon: typeof UserCheck; target: Target; tone: string }> = [
    { key: 'pending', label: tr('Onay bekleyen adaylar'), hint: tr('Etkinlik bağlantısını kontrol edin'), icon: UserCheck, target: 'candidates', tone: 'brand' },
    { key: 'issues', label: tr('Eksik veya hatalı belge'), hint: tr('Düzeltme bekleyen başvurular'), icon: FileWarning, target: 'applications', tone: 'warn' },
    { key: 'unread', label: tr('Okunmamış mesajlar'), hint: tr('Adaylardan gelen mesajlar'), icon: MessageSquare, target: 'messages', tone: 'info' },
    { key: 'total', label: tr('Toplam başvuru'), hint: tr('Tüm program başvuruları'), icon: ClipboardList, target: 'applications', tone: 'neutral' },
  ];
  return (
    <section className="admin-overview" aria-label={tr('Özet')}>
      <div className="member-greeting">
        <span className="brand-eyebrow">{tr('Yönetim paneli')}</span>
        <h1>
          {greeting}, {name.split(' ')[0]}
        </h1>
      </div>
      <div className="stat-grid">
        {cards.map(({ key, label, hint, icon: Icon, target, tone }) => (
          <button key={key} className={`stat-card ${tone}`} onClick={() => open(target)}>
            <span className="stat-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <span className="stat-value">{counts[key] ?? '–'}</span>
            <strong>{label}</strong>
            <small>{hint}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
