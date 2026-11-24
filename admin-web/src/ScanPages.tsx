import { translate as tr } from './locale';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Camera, FileText, Trash2 } from 'lucide-react';
import { Feedback, errorMessage } from './ui';
import { useLeaveWarning } from './workflows';

export const ScanPages = ({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled: boolean;
}) => {
  const [pages, setPages] = useState<File[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useLeaveWarning(!!pages.length);
  const add = (files: File[]) => {
    if (!files.length) return;
    const next = [...pages, ...files];
    if (
      next.length > 20 ||
      next.some(
        f => !['image/jpeg', 'image/png'].includes(f.type) || !f.size,
      ) ||
      next.reduce((sum, f) => sum + f.size, 0) > 20 * 1024 * 1024
    ) {
      setError(tr('En fazla 20 JPG/PNG sayfa ve toplam 20 MB seçebilirsiniz.'));
      return;
    }
    setError('');
    setPages(next);
  };
  const reorder = (from: number, to: number) => {
    const next = [...pages];
    [next[from], next[to]] = [next[to], next[from]];
    setPages(next);
  };
  const build = async () => {
    setBusy(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      for (const file of pages) {
        const data = await file.arrayBuffer();
        const img =
          file.type === 'image/png'
            ? await pdf.embedPng(data)
            : await pdf.embedJpg(data);
        const p = pdf.addPage([595, 842]);
        const fit = img.scaleToFit(555, 802);
        p.drawImage(img, {
          ...fit,
          x: (595 - fit.width) / 2,
          y: (842 - fit.height) / 2,
        });
      }
      const bytes = await pdf.save();
      if (bytes.length > 20 * 1024 * 1024)
        throw new Error(tr('Oluşan PDF 20 MB sınırını aşıyor.'));
      onFile(
        new File([new Uint8Array(bytes).buffer], 'taranan-belge.pdf', {
          type: 'application/pdf',
        }),
      );
      setPages([]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="scan">
      <summary>
        <Camera size={16} /> {tr('Fotoğraflardan PDF oluştur')}
      </summary>
      <fieldset disabled={busy || disabled}>
        <label>
          {tr('Kameradan sayfa ekle')}
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            onChange={e => {
              add(Array.from(e.target.files || []));
              e.target.value = '';
            }}
          />
        </label>
        <label>
          {tr('Galeriden sayfalar seç')}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={e => {
              add(Array.from(e.target.files || []));
              e.target.value = '';
            }}
          />
        </label>
        {pages.map((p, i) => (
          <div className="member-row" key={i}>
            <span>
              {i + 1}. {p.name}
            </span>
            <div className="button-row">
              {(
                [
                  [ArrowUp, tr('Yukarı'), i === 0, () => reorder(i, i - 1)],
                  [
                    ArrowDown,
                    tr('Aşağı'),
                    i === pages.length - 1,
                    () => reorder(i, i + 1),
                  ],
                  [
                    Trash2,
                    tr('Kaldır'),
                    false,
                    () => setPages(pages.filter((_, n) => n !== i)),
                  ],
                ] as const
              ).map(([Icon, label, off, fn]) => (
                <button
                  key={label}
                  type="button"
                  className="icon-button"
                  title={label}
                  aria-label={`${i + 1}. ${tr('sayfa')}: ${label}`}
                  disabled={off}
                  onClick={fn}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <Feedback error={error} />
        <button
          className="secondary"
          type="button"
          disabled={!pages.length || busy}
          onClick={() => void build()}
        >
          <FileText size={16} />
          {busy ? tr('PDF hazırlanıyor…') : tr('Bu sayfaları kullan')}
        </button>
      </fieldset>
    </details>
  );
};
