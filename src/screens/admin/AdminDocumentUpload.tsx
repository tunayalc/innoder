import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { Button } from '../../components';
import { DOCUMENT_TYPES } from '../../constants';
import { useAuth } from '../../hooks';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { ACTIVE_DOCUMENT_TYPES } from '../../services/programFactory';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplicationError } from '../../store/selectors';
import { uploadAdminDocument } from '../../store/thunks/applicationThunks';
import { useThemedStyles, type AppColors } from '../../theme';
import type { Application, DocumentType } from '../../types';

const documentTypes: DocumentType[] = [...ACTIVE_DOCUMENT_TYPES, 'agreement'];
const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
};
type SelectedFile = { name: string; uri: string; mimeType: string };

export const AdminDocumentUpload = ({ application }: { application: Application }) => {
  const { isAdmin } = useAuth();
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const uploadError = useAppSelector(selectApplicationError);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DocumentType>();
  const [file, setFile] = useState<SelectedFile>();
  const [picking, setPicking] = useState(false);
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const [success, setSuccess] = useState(false);
  const key = useRef<string | undefined>(undefined);
  const request = useRef<AbortController | undefined>(undefined);
  useUnsavedChanges(isAdmin && Boolean(file));
  useEffect(() => () => request.current?.abort(), []);

  if (!isAdmin) return null;

  const uploading = progress !== undefined;
  const busy = uploading || picking;
  const replaces = type !== 'extra' && application.documents.some(doc =>
    doc.type === type && Boolean(doc.fileName),
  );
  const choose = async () => {
    setPicking(true);
    setError('');
    setFailed(false);
    try {
      const [selected] = await pick({
        type: [types.pdf, ...(Platform.OS === 'ios'
          ? ['public.jpeg', 'public.png']
          : ['image/jpeg', 'image/png'])],
      });
      if (!selected) return;
      const extension = selected.name?.match(/\.(pdf|jpe?g|png)$/i)?.[1]?.toLowerCase();
      const mimeType = selected.name ? (extension && mimeByExtension[extension]) : selected.type;
      const fallbackExtension = mimeType === 'image/jpeg' ? 'jpg' : mimeType?.split('/').pop();
      if (
        !mimeType || !Object.values(mimeByExtension).includes(mimeType) ||
        (selected.type && selected.type !== 'application/octet-stream' && selected.type !== mimeType) ||
        selected.isVirtual || selected.size === 0 || (selected.size ?? 0) > 20 * 1024 * 1024
      ) {
        setError('20 MB’ı aşmayan geçerli bir PDF, JPG veya PNG seçin.');
        return;
      }
      key.current = undefined;
      setFile({ uri: selected.uri, name: selected.name || `belge.${fallbackExtension}`, mimeType });
    } catch (cause) {
      if (!(isErrorWithCode(cause) && cause.code === errorCodes.OPERATION_CANCELED))
        setError('Dosya seçilemedi. Tekrar deneyin.');
    } finally {
      setPicking(false);
    }
  };
  const submit = async () => {
    if (!file || !type || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    key.current ??= `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setFailed(false);
    setError('');
    setProgress(0);
    try {
      const saved = await dispatch(uploadAdminDocument({
        applicationId: application.id,
        documentType: type,
        fileUrl: file.uri,
        fileName: file.name,
        mimeType: file.mimeType,
        pageCount: 1,
        idempotencyKey: key.current,
        signal: controller.signal,
        onProgress: setProgress,
      }));
      if (controller.signal.aborted) return;
      if (!saved) {
        setFailed(true);
        return;
      }
      key.current = undefined;
      setFile(undefined);
      setOpen(false);
      setSuccess(true);
    } finally {
      request.current = undefined;
      if (!controller.signal.aborted) setProgress(undefined);
    }
  };

  if (!open) return (
    <>
      <Button label="Belge Ekle" variant="ghost" onPress={() => { setOpen(true); setSuccess(false); }} />
      {success && <Text accessibilityLiveRegion="polite" style={styles.text}>Belge başvuruya eklendi.</Text>}
    </>
  );

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Belge türü</Text>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {documentTypes.map(kind => (
          <Pressable
            key={kind}
            accessibilityRole="radio"
            accessibilityLabel={DOCUMENT_TYPES[kind]}
            accessibilityState={{ checked: type === kind, disabled: busy }}
            disabled={busy}
            style={[styles.choice, type === kind && styles.selected]}
            onPress={() => {
              if (type === kind) return;
              setType(kind);
              key.current = undefined;
              setFailed(false);
            }}
          >
            <Text style={styles.text}>{DOCUMENT_TYPES[kind]}</Text>
          </Pressable>
        ))}
      </View>
      <Button label={file ? 'Dosyayı Değiştir' : 'Dosya Seç'} variant="ghost"
        loading={picking} disabled={uploading} onPress={choose} />
      <Text style={styles.hint}>{file?.name || 'PDF, JPG, PNG · en fazla 20 MB'}</Text>
      {replaces && <Text style={styles.hint}>Önceki dosya belge geçmişinde kalır.</Text>}
      {(error || failed) && <Text accessibilityRole="alert" style={styles.error}>
        {error || uploadError || 'Belge yüklenemedi. Tekrar deneyin.'}
      </Text>}
      <Button
        label={uploading ? `Yükleniyor · %${progress}` : replaces ? 'Yeni Sürümü Yükle' : 'Belgeyi Yükle'}
        loading={uploading} disabled={picking || !type || !file} onPress={submit}
      />
      <Button label="Vazgeç" variant="ghost" disabled={busy} onPress={() => {
        setFile(undefined);
        setError('');
        setFailed(false);
        setOpen(false);
        key.current = undefined;
      }} />
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  form: { gap: 8, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: 6, padding: 10, maxWidth: '100%' },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceContainerHigh },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  text: { color: colors.textPrimary, fontSize: 14 },
  hint: { color: colors.textSecondary, fontSize: 13 },
  error: { color: colors.error, fontSize: 13 },
});
