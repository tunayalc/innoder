import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { colors } from '../../theme';
import { useAuth } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectApplications } from '../../store/selectors';
import { selectMessagesByApplicationId } from '../../store/selectors/messageSelectors';
import { selectMessageLoading } from '../../store/selectors/messageSelectors';
import { loadMessageThread, markThreadRead, sendMessageThunk } from '../../store/thunks/messageThunks';
import { getRelativeTime } from '../../utils/date';
import { Message, AdayMesajRouteProp } from '../../types';

export const AdayMesajScreen: React.FC = () => {
  const route = useRoute<AdayMesajRouteProp>();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const flatListRef = useRef<FlatList>(null);

  // Find the application - either from route params or the user's application
  const applicationId = useMemo(() => {
    if (route.params?.applicationId) return route.params.applicationId;
    const myApp = applications.find((app) => app.userId === user?.id);
    return myApp?.id || '';
  }, [route.params?.applicationId, applications, user?.id]);

  const messages = useAppSelector(selectMessagesByApplicationId(applicationId));
  const isLoading = useAppSelector(selectMessageLoading);
  const error = useAppSelector((s) => s.message.error);
  const [newMessage, setNewMessage] = useState('');

  const application = useMemo(
    () => applications.find((app) => app.id === applicationId),
    [applications, applicationId],
  );

  useEffect(() => {
    if (!applicationId) return;
    dispatch(loadMessageThread({ applicationId }));
    dispatch(markThreadRead({ applicationId }));
  }, [dispatch, applicationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !user || !applicationId) return;

    dispatch(sendMessageThunk({ applicationId, content: newMessage.trim() }));
    setNewMessage('');
  }, [newMessage, user, applicationId, dispatch]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
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
              ? 'Siz'
              : item.senderRole === 'admin'
                ? 'Admin'
                : 'Aday'}
          </Text>
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.msgTime}>{getRelativeTime(item.createdAt)}</Text>
        </View>
      );
    },
    [user?.id],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.h2}>Mesajlaşma</Text>
        {application && (
          <Text style={styles.subtitle}>
            {application.personalInfo.fullName} - {application.programName}
          </Text>
        )}
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          {isLoading ? (
            <Text style={styles.emptyText}>Mesajlar yükleniyor...</Text>
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>
              Henüz mesaj yok. Eksik veya hatalı belgeler hakkında admin ile
              iletişime geçebilirsiniz.
            </Text>
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
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  header: {
    padding: 20,
    paddingBottom: 8,
  } as ViewStyle,
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  } as TextStyle,
  messageList: {
    padding: 20,
    paddingTop: 8,
    gap: 10,
  } as ViewStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  } as ViewStyle,
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  msgBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: '80%',
    gap: 4,
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
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  } as TextStyle,
  msgText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  } as TextStyle,
  msgTime: {
    fontSize: 10,
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
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 100,
  } as TextStyle,
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  } as ViewStyle,
  sendButtonDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  sendButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  } as TextStyle,
});
