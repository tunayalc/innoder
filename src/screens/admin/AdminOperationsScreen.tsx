import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Button, InputField, StateMessage } from '../../components';
import { apiClient, requireData } from '../../services/api/apiClient';
import { appConfig } from '../../config/appConfig';
import { useThemedStyles, type AppColors } from '../../theme';
import type { RootStackNavigationProp, RootStackParamList } from '../../types';

interface Item {
  id: string;
  name: string;
  email?: string;
  threadId?: string;
  programName?: string;
  unread?: number;
  status?: string;
  reason?: string;
}
export const AdminOperationsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AdminOperations'>>(),
    navigation = useNavigation<RootStackNavigationProp>();
  const styles = useThemedStyles(createStyles),
    messages = route.params.section === 'messages';
  const [items, setItems] = useState<Item[]>([]),
    [query, setQuery] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [pageNumber, setPageNumber] = useState(1),
    [total, setTotal] = useState(0);
  const sequence = useRef(0);
  const invalidateRequests = useCallback(() => {
    sequence.current++;
  }, []);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      if (appConfig.dataSource === 'mock') {
        setItems([]);
        return;
      }
      if (messages && query.trim()) {
        const page = requireData(
          await apiClient.get<{ items: Item[]; total: number }>(
            `/admin/candidates?page=${pageNumber}&pageSize=25&q=${encodeURIComponent(
              query,
            )}`,
          ),
        );
        if (request !== sequence.current) return;
        setItems(
          page.items.map(item => ({ ...item, threadId: `general:${item.id}` })),
        );
        setTotal(page.total);
      } else if (messages) {
        const page = requireData(
          await apiClient.get<{ items: Item[]; total: number }>(
            `/messages/summary?page=${pageNumber}&pageSize=25`,
          ),
        );
        if (request !== sequence.current) return;
        setItems(page.items.map(item => ({ ...item, id: item.threadId! })));
        setTotal(page.total);
      } else {
        const result = requireData(
          await apiClient.get<Item[]>('/admin/deletion-requests'),
        );
        if (request !== sequence.current) return;
        setItems(
          result.map(item => ({ ...item, id: item.id || item.threadId! })),
        );
      }
    } catch (cause) {
      if (request === sequence.current)
        setError(
          cause instanceof Error ? cause.message : 'Veriler yüklenemedi.',
        );
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, [messages, query, pageNumber]);
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => {
      clearTimeout(timer);
      invalidateRequests();
    };
  }, [load, invalidateRequests]);
  const complete = (item: Item) =>
    Alert.alert(
      'Hesap Silme Talebi',
      `${item.name}\n${
        item.reason || ''
      }\nKişisel bilgiler anonimleştirilecek, belgeler kalıcı silinecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Anonimleştir ve Sil',
          style: 'destructive',
          onPress: async () => {
            if (busy) return;
            setBusy(true);
            try {
              const result = requireData(
                await apiClient.post<{ message: string }>(
                  `/admin/deletion-requests/${item.id}/complete`,
                  {},
                ),
              );
              Alert.alert('İşlem Sonucu', result.message);
              await load();
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : 'İşlem tamamlanamadı.',
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  return (
    <View style={styles.container}>
      {messages ? (
        <InputField
          label="Aday ara"
          value={query}
          onChangeText={value => {
            setQuery(value);
            setPageNumber(1);
          }}
          autoCapitalize="none"
        />
      ) : null}
      {error ? <StateMessage kind="error" message={error} /> : null}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={load}
        initialNumToRender={10}
        windowSize={7}
        ListFooterComponent={
          messages && total > 25 ? (
            <View style={styles.row}>
              <Button
                label="Önceki"
                disabled={loading || pageNumber === 1}
                onPress={() => setPageNumber(value => value - 1)}
              />
              <Text style={styles.title}>
                {pageNumber} / {Math.ceil(total / 25)}
              </Text>
              <Button
                label="Sonraki"
                disabled={loading || pageNumber * 25 >= total}
                onPress={() => setPageNumber(value => value + 1)}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <StateMessage
            kind={loading ? 'loading' : 'empty'}
            message={
              loading
                ? 'Yükleniyor...'
                : messages
                ? 'Henüz konuşma yok. Aday arayarak genel mesaj başlatabilirsiniz.'
                : 'Bekleyen hesap silme talebi yok.'
            }
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.content}>
              <Text style={styles.title}>{item.name || 'Konuşma'}</Text>
              {messages ? (
                <Text style={styles.detail}>
                  {item.threadId?.startsWith('general:')
                    ? 'Genel mesajlar'
                    : item.programName || 'Başvuru mesajları'}
                </Text>
              ) : null}
              <Text style={styles.detail}>
                {item.email ||
                  (item.unread
                    ? `${item.unread} okunmamış mesaj`
                    : item.status === 'approved'
                    ? 'Dosya temizliği sürüyor'
                    : '')}
              </Text>
            </View>
            {messages ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${item.name} mesajlarını aç`}
                style={styles.action}
                onPress={() =>
                  navigation.navigate('AdayMesaj', {
                    applicationId: item.threadId!,
                  })
                }
              >
                <Text style={styles.link}>Aç</Text>
              </TouchableOpacity>
            ) : (
              <Button
                label="İncele"
                disabled={busy}
                variant="ghost"
                onPress={() => complete(item)}
              />
            )}
          </View>
        )}
      />
    </View>
  );
};
const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      gap: 12,
      backgroundColor: colors.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    content: { flex: 1 },
    title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    detail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    action: {
      minWidth: 48,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    link: { color: colors.primaryText, fontWeight: '700' },
  });
