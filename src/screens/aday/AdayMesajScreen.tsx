import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useStore } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  layout,
  useAppTheme,
  useThemedStyles,
  type AppColors,
} from '../../theme';
import { StateMessage } from '../../components';
import type { RootState } from '../../store';
import { useAuth } from '../../hooks';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useI18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import {
  selectMessagesByApplicationId,
  selectMessageLoading,
} from '../../store/selectors/messageSelectors';
import {
  loadMessageThread,
  markThreadRead,
  sendMessageThunk,
} from '../../store/thunks/messageThunks';
import { getRelativeTime } from '../../utils/date';
import {
  Message,
  AdayMesajRouteProp,
  createGeneralChatThreadId,
  isGeneralChatThreadId,
} from '../../types';

export const AdayMesajScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const route = useRoute<AdayMesajRouteProp>();
  const { user, isAdmin } = useAuth();
  const { t, language } = useI18n();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const insets = useSafeAreaInsets();
  const applications = useAppSelector(selectApplications);
  const flatListRef = useRef<FlatList>(null);
  const [newMessage, setNewMessage] = useState('');
  useUnsavedChanges(Boolean(newMessage));
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const [historyPage, setHistoryPage] = useState(1),
    [hasOlder, setHasOlder] = useState(false);
  const loadingOlder = useRef(false);

  const activeThreadId =
    route.params?.applicationId ||
    (!isAdmin && user ? createGeneralChatThreadId(user.id) : '');
  const isGeneralThread = isGeneralChatThreadId(activeThreadId);

  const messages = useAppSelector(
    selectMessagesByApplicationId(activeThreadId || ''),
  );
  const isLoading = useAppSelector(selectMessageLoading);
  const error = useAppSelector(state => state.message.error);

  const application = useMemo(
    () =>
      isGeneralThread
        ? null
        : applications.find(app => app.id === activeThreadId) || null,
    [applications, activeThreadId, isGeneralThread],
  );

  useEffect(() => {
    if (!activeThreadId) return;
    let active = true;
    setHasOlder(false);
    setHistoryPage(1);
    dispatch(loadMessageThread({ applicationId: activeThreadId })).then(
      result => {
        if (active && result) {
          setHistoryPage(result.page);
          setHasOlder(result.hasMore);
          dispatch(markThreadRead({ applicationId: activeThreadId }));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [dispatch, activeThreadId]);

  useEffect(() => {
    if (messages.length === 0 || historyPage > 1 || loadingOlder.current)
      return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, historyPage]);

  const handleSend = useCallback(async () => {
    if (
      !newMessage.trim() ||
      !user ||
      !activeThreadId ||
      sendingRef.current ||
      isLoading
    )
      return;
    const draft = newMessage;
    const previousIds = new Set(
      store.getState().message.messages.map(message => message.id),
    );
    sendingRef.current = true;
    setIsSending(true);
    try {
      await dispatch(
        sendMessageThunk({
          applicationId: activeThreadId,
          content: draft.trim(),
        }),
      );
      // The existing thunk reports failure in Redux, not by rejecting its promise.
      const delivered = store
        .getState()
        .message.messages.some(
          message =>
            !previousIds.has(message.id) &&
            message.applicationId === activeThreadId &&
            message.senderId === user.id &&
            message.content === draft.trim(),
        );
      if (delivered)
        setNewMessage(current => (current === draft ? '' : current));
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, [activeThreadId, dispatch, isLoading, newMessage, store, user]);
  const sendDisabled =
    !newMessage.trim() || !activeThreadId || isSending || isLoading;

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    return (
      <View
        style={[
          styles.msgBubble,
          isOwnMessage ? styles.msgUser : styles.msgAdmin,
        ]}
      >
        <Text style={styles.msgSender}>
          {isOwnMessage
            ? t('candidateMessages.you')
            : item.senderRole === 'admin'
            ? t('candidateMessages.admin')
            : t('candidateMessages.candidate')}
        </Text>
        <Text style={styles.msgText}>{item.content}</Text>
        <Text style={styles.msgTime}>{getRelativeTime(item.createdAt)}</Text>
      </View>
    );
  };

  const emptyMessageText = !activeThreadId
    ? t('candidateMessages.noThread')
    : isGeneralThread
    ? t('candidateMessages.emptyGeneral')
    : t('candidateMessages.emptyProgram');

  const headerSubtitle = isGeneralThread
    ? t('candidateMessages.generalTitle')
    : application
    ? application.programName
    : t('candidateMessages.threadNotFound');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      <View style={styles.header}>
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Text accessibilityRole="header" style={styles.h2}>
              {t('candidateMessages.title')}
            </Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        </View>
      </View>

      {!activeThreadId ? (
        <View style={styles.emptyContainer}>
          <StateMessage message={emptyMessageText} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <StateMessage
            kind={isLoading ? 'loading' : error ? 'error' : 'empty'}
            message={
              isLoading
                ? t('candidateMessages.loading')
                : error || emptyMessageText
            }
            actionLabel={error && !isLoading ? t('common.refresh') : undefined}
            onAction={() =>
              dispatch(loadMessageThread({ applicationId: activeThreadId }))
            }
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={15}
          windowSize={7}
          ListHeaderComponent={
            hasOlder ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  language === 'en'
                    ? 'Load earlier messages'
                    : 'Önceki mesajları yükle'
                }
                disabled={isLoading}
                onPress={async () => {
                  if (loadingOlder.current) return;
                  loadingOlder.current = true;
                  try {
                    const result = await dispatch(
                      loadMessageThread({
                        applicationId: activeThreadId,
                        page: historyPage + 1,
                      }),
                    );
                    if (result) {
                      setHistoryPage(result.page);
                      setHasOlder(result.hasMore);
                    }
                  } finally {
                    loadingOlder.current = false;
                  }
                }}
              >
                <Text style={styles.subtitle}>
                  {isLoading
                    ? t('candidateMessages.loading')
                    : language === 'en'
                    ? 'Earlier messages'
                    : 'Önceki mesajlar'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {error && messages.length > 0 ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={
            isGeneralThread
              ? t('candidateMessages.placeholderGeneral')
              : t('candidateMessages.placeholderProgram')
          }
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={
            isGeneralThread
              ? t('candidateMessages.placeholderGeneral')
              : t('candidateMessages.placeholderProgram')
          }
          multiline
          maxLength={4000}
          editable={Boolean(activeThreadId) && !isSending}
        />
        <TouchableOpacity
          style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sendDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('candidateMessages.send')}
          accessibilityState={{ disabled: sendDisabled, busy: isSending }}
        >
          {isSending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Icon name="send" size={22} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      backgroundColor: colors.background,
    } as ViewStyle,
    header: {
      padding: 20,
      paddingBottom: 10,
    } as ViewStyle,
    headerCard: {
      flexDirection: 'row',
      gap: 14,
    } as ViewStyle,
    headerContent: {
      flex: 1,
      gap: 4,
    } as ViewStyle,
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    } as TextStyle,
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    } as TextStyle,
    messageList: {
      padding: 20,
      paddingTop: 8,
      gap: 14,
    } as ViewStyle,
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    } as ViewStyle,
    errorText: {
      fontSize: 15,
      color: colors.danger,
      paddingHorizontal: 20,
      paddingVertical: 12,
      textAlign: 'center',
      lineHeight: 22,
    } as TextStyle,
    msgBubble: {
      padding: 14,
      borderRadius: 8,
      maxWidth: '90%',
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 5,
    } as ViewStyle,
    msgAdmin: {
      backgroundColor: colors.msgAdmin,
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
    } as ViewStyle,
    msgUser: {
      backgroundColor: colors.msgUser,
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    } as ViewStyle,
    msgSender: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    } as TextStyle,
    msgText: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 21,
    } as TextStyle,
    msgTime: {
      fontSize: 12,
      color: colors.textMuted,
      alignSelf: 'flex-end',
    } as TextStyle,
    inputRow: {
      flexDirection: 'row',
      padding: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.cardBg,
      alignItems: 'flex-end',
    } as ViewStyle,
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.outline,
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
      maxHeight: 100,
      textAlignVertical: 'top',
    } as TextStyle,
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    sendButtonDisabled: {
      opacity: 0.4,
    } as ViewStyle,
  });
