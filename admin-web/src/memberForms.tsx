import { translate as tr } from './locale';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Plus, Trash2, Download, Eye, Save } from 'lucide-react';
import { api } from './api';
import type { Application, User } from './types';
import { EmptyState, Feedback, Modal, errorMessage } from './ui';
import { useLeaveWarning } from './workflows';
import {
  CEFR_LEVELS,
  createEmptyEuropassCv,
  createEmptyMotivationLetter,
  wordCount,
  type EuropassCvProfile,
} from './shared/europass';

export function useAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const run = async (task: () => Promise<void>, message = '') => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await task();
      setSuccess(message);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return { busy, run, feedback: <Feedback error={error} success={success} /> };
}

export function ProfileForm({
  user,
  onSaved,
}: {
  user: User;
  onSaved: (user: User) => void;
}) {
  const [identity, setIdentity] = useState(user.identityType || 'turkish_id'),
    [dirty, setDirty] = useState(false);
  const action = useAction();
  useLeaveWarning(dirty);
  const fields = [
    ['name', tr('Ad soyad'), 'text', 160],
    ['phone', tr('Telefon'), 'tel', 40],
    ['country', tr('Ülke'), 'text', 100],
    ['city', tr('Şehir'), 'text', 100],
    ['birthDate', tr('Doğum tarihi'), 'date', 10],
    ['nationality', tr('Uyruk'), 'text', 100],
  ] as const;
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const patch = Object.fromEntries(data.entries());
    void action.run(async () => {
      const updated = await api.saveProfile({
        ...patch,
        revision: user.revision,
      });
      onSaved(updated);
      setDirty(false);
    }, tr('Kişisel bilgileriniz kaydedildi.'));
  };
  return (
    <form
      className="member-form"
      onSubmit={submit}
      onChange={() => setDirty(true)}
    >
      <div className="member-fields">
        {fields.map(([name, label, type, len]) => (
          <label key={name}>
            {label}
            <input
              name={name}
              type={type}
              maxLength={len}
              max={
                type === 'date'
                  ? new Date().toISOString().slice(0, 10)
                  : undefined
              }
              defaultValue={user[name]?.slice(
                0,
                type === 'date' ? 10 : undefined,
              )}
              required={name === 'name'}
            />
          </label>
        ))}
        <label>
          {tr('Kimlik belgesi')}
          <select
            name="identityType"
            value={identity}
            onChange={e => setIdentity(e.target.value as typeof identity)}
          >
            <option value="turkish_id">{tr('T.C. kimlik kartı')}</option>
            <option value="passport">{tr('Pasaport')}</option>
          </select>
        </label>
        {identity === 'passport' ? (
          <label>
            {tr('Pasaport numarası')}
            <input
              key="passport"
              name="passportNumber"
              required
              maxLength={32}
              defaultValue={user.passportNumber}
            />
          </label>
        ) : (
          <label>
            {tr('T.C. kimlik numarası')}
            <input
              key="identity"
              name="identityNumber"
              required
              pattern="[0-9]{11}"
              maxLength={11}
              inputMode="numeric"
              defaultValue={user.identityNumber}
            />
          </label>
        )}
        <label>
          {tr('PNR numarası')}
          <input
            name="pnrNumber"
            maxLength={32}
            defaultValue={user.pnrNumber}
          />
        </label>
      </div>
      {action.feedback}
      <button className="primary" disabled={action.busy || !dirty}>
        <Save size={16} /> {tr('Bilgileri kaydet')}
      </button>
    </form>
  );
}

const labels = {
  profileTitle: tr('Profil başlığı'),
  summary: tr('Profil özeti (en az 40 karakter)'),
  keySkills: tr('Temel beceriler (en az 20 karakter)'),
  digitalSkills: tr('Dijital beceriler'),
  role: tr('Görev'),
  organization: tr('Kurum'),
  startDate: tr('Başlangıç'),
  endDate: tr('Bitiş'),
  responsibilities: tr('Sorumluluklar'),
  qualification: tr('Diploma / yeterlilik'),
  institution: tr('Eğitim kurumu'),
  description: tr('Açıklama'),
  language: tr('Dil'),
  listening: tr('Dinleme'),
  reading: tr('Okuma'),
  spokenInteraction: tr('Karşılıklı konuşma'),
  spokenProduction: tr('Sözlü anlatım'),
  writing: tr('Yazma'),
  addressee: tr('Muhatap'),
  subject: tr('Konu'),
  openingParagraph: tr('Giriş'),
  motivationParagraph: tr('Motivasyon'),
  contributionParagraph: tr('Katkınız'),
  closingParagraph: tr('Kapanış'),
};
const sections = {
  workExperiences: tr('İş deneyimi'),
  educationEntries: tr('Eğitim'),
  languageSkills: tr('Dil becerileri'),
} as const;

export function DraftForm({
  item,
  kind,
  onSaved,
}: {
  item: Application;
  kind: 'cv' | 'motivation';
  onSaved: (v: Application) => void;
}) {
  const [preview, setPreview] = useState(false);
  const [cv, setCv] = useState(
    () => item.personalInfo.europassCv ?? createEmptyEuropassCv(),
  );
  const [letter, setLetter] = useState(
    () => item.personalInfo.motivationLetter ?? createEmptyMotivationLetter(),
  );
  const [dirty, setDirty] = useState(false);
  const action = useAction();
  useLeaveWarning(dirty);
  const changeRows = <K extends keyof typeof sections>(
    section: K,
    rows: EuropassCvProfile[K],
  ) => {
    setCv({ ...cv, [section]: rows });
    setDirty(true);
  };
  return (
    <form
      className="member-form"
      onChange={() => setDirty(true)}
      onSubmit={e => {
        e.preventDefault();
        void action.run(async () => {
          onSaved(
            await api.saveDraft(
              item.id,
              kind === 'cv' ? { europassCv: cv } : { motivationLetter: letter },
              item.revision,
            ),
          );
          setDirty(false);
        }, tr('Taslak kaydedildi.'));
      }}
    >
      <fieldset disabled={action.busy}>
        <legend>
          {kind === 'cv' ? 'Europass CV' : tr('Motivasyon mektubu')}
        </legend>
        {kind === 'cv' ? (
          <>
            {(
              ['profileTitle', 'summary', 'keySkills', 'digitalSkills'] as const
            ).map(key => (
              <label key={key}>
                {labels[key]}
                {key === 'profileTitle' ? (
                  <input
                    value={cv[key]}
                    maxLength={10000}
                    onChange={e => setCv({ ...cv, [key]: e.target.value })}
                  />
                ) : (
                  <textarea
                    value={cv[key]}
                    maxLength={10000}
                    onChange={e => setCv({ ...cv, [key]: e.target.value })}
                  />
                )}
              </label>
            ))}
            {(Object.keys(sections) as Array<keyof typeof sections>).map(
              section => (
                <section className="form-section" key={section}>
                  <h3>{sections[section]}</h3>
                  {cv[section].map((row, index) => (
                    <div className="member-fields repeat-row" key={index}>
                      {(
                        Object.keys(
                          createEmptyEuropassCv()[section][0],
                        ) as Array<keyof typeof labels>
                      ).map(key => {
                        const value =
                          (row as unknown as Record<string, string>)[key] || '';
                        const change = (value: string) =>
                          changeRows(
                            section,
                            cv[section].map((old, i) =>
                              i === index ? { ...old, [key]: value } : old,
                            ) as (typeof cv)[typeof section],
                          );
                        return (
                          <label key={key}>
                            {labels[key]}
                            {section === 'languageSkills' &&
                            key !== 'language' ? (
                              <select
                                value={value}
                                onChange={e => change(e.target.value)}
                              >
                                {CEFR_LEVELS.map(level => (
                                  <option key={level}>{level}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={value}
                                maxLength={10000}
                                onChange={e => change(e.target.value)}
                              />
                            )}
                          </label>
                        );
                      })}
                      <button
                        className="icon-button"
                        type="button"
                        title={tr('Satırı kaldır')}
                        aria-label={`${sections[section]} ${index + 1} ${tr(
                          'kaldır',
                        )}`}
                        onClick={() =>
                          changeRows(
                            section,
                            cv[section].filter(
                              (_, i) => i !== index,
                            ) as (typeof cv)[typeof section],
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="secondary small"
                    disabled={cv[section].length >= 40}
                    onClick={() =>
                      changeRows(section, [
                        ...cv[section],
                        createEmptyEuropassCv()[section][0],
                      ] as (typeof cv)[typeof section])
                    }
                  >
                    <Plus size={16} /> {sections[section]} {tr('ekle')}
                  </button>
                </section>
              ),
            )}
          </>
        ) : (
          (Object.keys(letter) as Array<keyof typeof letter>).map(key => (
            <label key={key}>
              {labels[key]}
              {key.endsWith('Paragraph') ? (
                <>
                  <textarea
                    maxLength={10000}
                    rows={4}
                    value={letter[key]}
                    onChange={e =>
                      setLetter({ ...letter, [key]: e.target.value })
                    }
                  />
                  <small>
                    {wordCount(letter[key])} /{' '}
                    {['openingParagraph', 'closingParagraph'].includes(key)
                      ? 20
                      : 40}{' '}
                    {tr('kelime')}
                  </small>
                </>
              ) : (
                <input
                  maxLength={10000}
                  value={letter[key]}
                  onChange={e =>
                    setLetter({ ...letter, [key]: e.target.value })
                  }
                />
              )}
            </label>
          ))
        )}
      </fieldset>
      {action.feedback}
      <div className="button-row">
        <button className="primary" disabled={action.busy || !dirty}>
          <Save size={16} /> {tr('Taslağı kaydet')}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={
            action.busy ||
            dirty ||
            !(kind === 'cv'
              ? item.personalInfo.europassCv
              : item.personalInfo.motivationLetter)
          }
          onClick={() => setPreview(true)}
        >
          <Eye size={16} />
          {tr('Belgeyi önizle')}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={
            action.busy ||
            dirty ||
            !(kind === 'cv'
              ? item.personalInfo.europassCv
              : item.personalInfo.motivationLetter)
          }
          onClick={() => void action.run(() => api.downloadPdf(item.id, kind))}
        >
          <Download size={16} /> {tr('PDF indir')}
        </button>
      </div>
      {preview && (
        <PdfPreview id={item.id} kind={kind} close={() => setPreview(false)} />
      )}
    </form>
  );
}

function PdfPreview({
  id,
  kind,
  close,
}: {
  id: string;
  kind: 'cv' | 'motivation';
  close: () => void;
}) {
  const [url, setUrl] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true,
      owned = '';
    api
      .previewPdf(id, kind)
      .then(v => {
        owned = v;
        if (active) setUrl(v);
        else URL.revokeObjectURL(v);
      })
      .catch(e => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
      if (owned) URL.revokeObjectURL(owned);
    };
  }, [id, kind]);
  return (
    <Modal
      title={kind === 'cv' ? 'Europass CV' : tr('Motivasyon mektubu')}
      wide
      onClose={close}
    >
      <div className="dialog-body">
        {url ? (
          <iframe title="PDF" className="member-preview" src={url} />
        ) : error ? (
          <Feedback error={error} />
        ) : (
          <EmptyState loading />
        )}
      </div>
    </Modal>
  );
}
