import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from './Button';
import { Field } from './Field';
import { appConfig } from '../config/appConfig';
import { useI18n } from '../i18n';
import { apiClient, requireData } from '../services/api/apiClient';
import { useAppTheme, useThemedStyles, type AppColors } from '../theme';

const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'] as const;
type HealthState = { available: boolean; consentVersion: string; bloodGroup?: string };
const version = 'esc-blood-group-v1';
const copy = {
  tr: {
    title: 'Kan grubu', optional: 'İsteğe bağlı',
    consent: 'Kan grubu bilgimin yalnız bu ESC projesinin başvuru ve hareketlilik işlemleri için kaydedilmesine ve yetkili İnno yöneticilerince görülmesine açık rıza veriyorum. Paylaşmadan başvurabilirim ve rızamı burada geri alabilirim.',
    save: 'Kan grubumu paylaş', revoke: 'Rızamı geri al', notSaved: 'İşlem tamamlanamadı. Tekrar dene.',
    hide: 'Kan grubunu gizle', show: 'Kan grubunu göster', noValue: 'Aday kan grubu paylaşmadı.',
  },
  en: {
    title: 'Blood group', optional: 'Optional',
    consent: 'I consent to my blood group being stored only for this ESC project’s application and mobility activities and viewed by authorized Inno administrators. I can apply without sharing it and withdraw my consent here.',
    save: 'Share my blood group', revoke: 'Withdraw my consent', notSaved: 'The action failed. Try again.',
    hide: 'Hide blood group', show: 'Show blood group', noValue: 'The candidate has not shared a blood group.',
  },
};

export const ProjectBloodGroup = ({ applicationId, readOnly = false }: { applicationId: string; readOnly?: boolean }) => {
  const { language } = useI18n();
  const labels = language === 'en' ? copy.en : copy.tr;
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const path = `/applications/${applicationId}/blood-group`;
  const [record, setRecord] = useState<HealthState>();
  const [selected, setSelected] = useState<(typeof groups)[number]>();
  const [accepted, setAccepted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const screen = useRef<AbortController | undefined>(undefined);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    screen.current = controller;
    if (!readOnly && appConfig.dataSource === 'remote')
      apiClient.get<HealthState>(path, { signal: controller.signal })
        .then(result => { if (!controller.signal.aborted) setRecord(requireData(result)); })
        .catch(() => undefined);
    return () => {
      controller.abort();
      setRecord(undefined);
      setSelected(undefined);
      setAccepted(false);
      setRevealed(false);
      setBusy(false);
      setError('');
    };
  }, [path, readOnly]));

  const run = async (action: 'view' | 'share' | 'revoke') => {
    const controller = screen.current;
    if (!controller || controller.signal.aborted || busy) return;
    if (action === 'share' && (!selected || !accepted || record?.consentVersion !== version)) return;
    setBusy(true);
    setError('');
    try {
      const options = { signal: controller.signal };
      const response = action === 'view' ? await apiClient.get<HealthState>(path, options)
        : action === 'revoke' ? await apiClient.delete<HealthState>(path, options)
        : await apiClient.put<HealthState>(path, {
          bloodGroup: selected, consentAccepted: true, consentVersion: version,
        }, options);
      if (controller.signal.aborted) return;
      setRecord(requireData(response));
      setRevealed(action === 'view');
      setSelected(undefined);
      setAccepted(false);
    } catch {
      if (!controller.signal.aborted) setError(labels.notSaved);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  if (appConfig.dataSource !== 'remote' || (!readOnly && (!record?.available || record.consentVersion !== version))) return null;

  if (readOnly) return (
    <View style={styles.content}>
      {revealed ? (
        <>
          {record?.bloodGroup ? <Field label={labels.title} value={record.bloodGroup} /> : <Text style={styles.text}>{labels.noValue}</Text>}
          <Button variant="ghost" label={labels.hide} onPress={() => { setRecord(undefined); setRevealed(false); }} />
        </>
      ) : <Button variant="ghost" label={labels.show} loading={busy} onPress={() => run('view')} />}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{labels.title}</Text>
      {record?.bloodGroup ? (
        <>
          <Field label={labels.title} value={record.bloodGroup} />
          <Button variant="ghost" label={labels.revoke} loading={busy} onPress={() => run('revoke')} />
        </>
      ) : (
        <>
          <Text style={styles.text}>{labels.optional}</Text>
          <View style={styles.options} accessibilityRole="radiogroup">
            {groups.map(group => (
              <Pressable key={group} accessibilityRole="radio" accessibilityState={{ checked: selected === group, disabled: busy }}
                disabled={busy} onPress={() => setSelected(group)}
                style={[styles.option, selected === group && styles.selected]}>
                <Text style={styles.text}>{group}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.consent}>
            <Text style={styles.consentText}>{labels.consent}</Text>
            <Switch accessibilityLabel={labels.consent} value={accepted} onValueChange={setAccepted}
              disabled={busy} trackColor={{ false: colors.muted, true: colors.teal }} />
          </View>
          <Button label={labels.save} disabled={!accepted || !selected} loading={busy} onPress={() => run('share')} />
        </>
      )}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.cardBg, gap: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  content: { gap: 8 },
  text: { color: colors.textPrimary, fontSize: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minWidth: 52, minHeight: 48, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceContainerHigh },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consentText: { color: colors.textPrimary, flex: 1, fontSize: 14, lineHeight: 21 },
  error: { color: colors.danger },
});
