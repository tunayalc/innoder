import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
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
import { useAppTheme, useThemedStyles, type AppColors } from '../../theme';
import { useAuth } from '../../hooks';
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
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const flatListRef = useRef<FlatList>(null);
  const [newMessage, setNewMessage] = useState('');

  const activeThreadId =
    route.params?.applicationId || (!isAdmin && user ? createGeneralChatThreadId(user.id) : '');
  const isGeneralThread = isGeneralChatThreadId(activeThreadId);

  const messages = useAppSelector(
    selectMessagesByApplicationId(activeThreadId || ''),
  );
  const isLoading = useAppSelector(selectMessageLoading);
  const error = useAppSelector((state) => state.message.error);

  const application = useMemo(
    () =>
      isGeneralThread
        ? null
        : applications.find((app) => app.id === activeThreadId) || null,
    [applications, activeThreadId, isGeneralThread],
  );

  useEffect(() => {
    if (!activeThreadId) return;
    dispatch(loadMessageThread({ applicationId: activeThreadId }));
    dispatch(markThreadRead({ applicationId: activeThreadId }));
  }, [dispatch, activeThreadId]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !user || !activeThreadId) return;

    dispatch(sendMessageThunk({ applicationId: activeThreadId, content: newMessage.trim() }));
    setNewMessage('');
  }, [activeThreadId, dispatch, newMessage, user]);

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
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <View style={styles.headerCard}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.h2}>{t('candidateMessages.title')}</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        </View>
      </View>

      {!activeThreadId ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessageText}</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          {isLoading ? (
            <Text style={styles.emptyText}>{t('candidateMessages.loading')}</Text>
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>{emptyMessageText}</Text>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.inputRow}>
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
          multiline
          maxLength={500}
          editable={Boolean(activeThreadId)}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || !activeThreadId) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || !activeThreadId}
        >
          <Text style={styles.sendButtonText}>{t('candidateMessages.send')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  header: {
    padding: 20,
    paddingBottom: 10,
  } as ViewStyle,
  headerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  } as ViewStyle,
  accentBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
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
    padding: 40,
  } as ViewStyle,
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  msgBubble: {
    padding: 14,
    borderRadius: 14,
    maxWidth: '80%',
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  } as TextStyle,
  msgText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  } as TextStyle,
  msgTime: {
    fontSize: 11,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  } as TextStyle,
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.cardBg,
    alignItems: 'flex-end',
  } as ViewStyle,
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  } as TextStyle,
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  } as ViewStyle,
  sendButtonDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  sendButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  } as TextStyle,
});
