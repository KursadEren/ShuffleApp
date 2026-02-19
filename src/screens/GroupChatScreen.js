import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { shuffleApi } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Anonim kullanıcı renkleri
const USER_COLORS = [
  { name: 'Mavi', color: '#3B82F6', bg: '#DBEAFE' },
  { name: 'Kırmızı', color: '#EF4444', bg: '#FEE2E2' },
  { name: 'Yeşil', color: '#10B981', bg: '#D1FAE5' },
  { name: 'Turuncu', color: '#F59E0B', bg: '#FEF3C7' },
  { name: 'Mor', color: '#8B5CF6', bg: '#EDE9FE' },
  { name: 'Pembe', color: '#EC4899', bg: '#FCE7F3' },
  { name: 'Cyan', color: '#06B6D4', bg: '#CFFAFE' },
  { name: 'Lime', color: '#84CC16', bg: '#ECFCCB' },
  { name: 'Amber', color: '#D97706', bg: '#FEF3C7' },
  { name: 'Gri', color: '#6B7280', bg: '#F3F4F6' },
];

const GroupChatScreen = ({ navigation, route }) => {
  const { shuffleId, shuffleData } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const inputScale = useRef(new Animated.Value(1)).current;

  // Kullanıcıya renk ata
  const getUserColor = useCallback((senderColor) => {
    if (senderColor) {
      const colorFromBackend = USER_COLORS.find(c =>
        c.name.toLowerCase() === senderColor.toLowerCase()
      );
      if (colorFromBackend) return colorFromBackend;
    }
    return USER_COLORS[0];
  }, []);

  // Mesajları çek
  const fetchMessages = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const response = await shuffleApi.getMessages(shuffleId);

      let messageList = [];
      if (response?.data?.messages) {
        messageList = response.data.messages;
      } else if (Array.isArray(response?.data)) {
        messageList = response.data;
      } else if (Array.isArray(response)) {
        messageList = response;
      }

      const mappedMessages = messageList.map((msg) => ({
        id: msg.id,
        senderColor: msg.senderColor,
        isMe: msg.isMe || false,
        content: msg.content || msg.text || msg.message,
        createdAt: msg.createdAt || msg.timestamp,
        type: msg.type?.toLowerCase() || 'text',
      }));

      setMessages(mappedMessages);

      try {
        const participantsResponse = await shuffleApi.getParticipants(shuffleId);
        const count = participantsResponse?.data?.currentCount ||
          participantsResponse?.data?.participants?.length || 0;
        setParticipantCount(count);
      } catch (e) {
        console.error('Failed to fetch participants:', e);
      }

    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shuffleId]);

  // Mesaj gönder
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Animate send button
    Animated.sequence([
      Animated.timing(inputScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(inputScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      await shuffleApi.sendMessage(shuffleId, { content: messageText });
      await fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.message || 'Mesaj gönderilemedi');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Polling
  useEffect(() => {
    fetchMessages();
    pollIntervalRef.current = setInterval(() => fetchMessages(), 5000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchMessages]);

  // Zaman formatla
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Tarih ayırıcı kontrolü
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === yesterday.toDateString()) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  // Mesaj renderla
  const renderMessage = ({ item, index }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

    // Sistem mesajı
    if (item.type === 'system') {
      return (
        <View>
          {showDateSeparator && (
            <View style={styles.dateSeparator}>
              <View style={styles.dateLine} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
              <View style={styles.dateLine} />
            </View>
          )}
          <View style={styles.systemMessage}>
            <View style={styles.systemMessageBubble}>
              <Icon name="information-outline" size={14} color="#6B7280" />
              <Text style={styles.systemMessageText}>{item.content}</Text>
            </View>
          </View>
        </View>
      );
    }

    const isOwnMessage = item.isMe;
    const userColor = getUserColor(item.senderColor);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}>
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: userColor.color }]}>
                <Text style={styles.avatarText}>
                  {userColor.name.charAt(0)}
                </Text>
              </View>
            </View>
          )}

          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}>
            {isOwnMessage ? (
              <View style={styles.ownBubbleInner}>
                <Text style={styles.ownMessageText}>{item.content}</Text>
                <View style={styles.messageFooter}>
                  <Text style={styles.ownMessageTime}>{formatTime(item.createdAt)}</Text>
                  <Icon name="check-all" size={14} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            ) : (
              <View style={[styles.otherBubbleInner, { borderLeftColor: userColor.color }]}>
                <Text style={[styles.senderName, { color: userColor.color }]}>
                  {userColor.name}
                </Text>
                <Text style={styles.messageText}>{item.content}</Text>
                <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerGradient}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
            <Text style={styles.loadingText}>Sohbet yükleniyor...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Icon name="account-group" size={20} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Grup Sohbeti</Text>
            </View>
            <View style={styles.participantBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.participantCount}>{participantCount} aktif katılımcı</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.menuButton}>
            <Icon name="dots-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Shuffle Info */}
        {shuffleData && (
          <View style={styles.shuffleInfoBar}>
            <View style={styles.infoItem}>
              <Icon name="map-marker" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.infoText} numberOfLines={1}>
                {shuffleData.location || 'Konum belirleniyor...'}
              </Text>
            </View>
            {shuffleData.scheduledAt && (
              <View style={styles.infoItem}>
                <Icon name="clock-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.infoText}>
                  {new Date(shuffleData.scheduledAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          refreshing={refreshing}
          onRefresh={() => fetchMessages(true)}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Icon name="chat-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyChatTitle}>Henüz mesaj yok</Text>
              <Text style={styles.emptyChatSubtitle}>İlk mesajı sen gönder!</Text>
            </View>
          }
        />

        {/* Modern Input Area */}
        <View style={[styles.inputWrapper, inputFocused && styles.inputWrapperFocused]}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="plus-circle" size={28} color="#6C63FF" />
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Mesajınızı yazın..."
                placeholderTextColor="#9CA3AF"
                value={newMessage}
                onChangeText={setNewMessage}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                multiline
                maxLength={500}
              />
              <TouchableOpacity style={styles.emojiButton}>
                <Icon name="emoticon-happy-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: inputScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={[
                    styles.sendButtonInner,
                    { backgroundColor: newMessage.trim() ? '#6C63FF' : '#D1D5DB' }
                  ]}>
                    <Icon name="send" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Header
  headerGradient: {
    backgroundColor: '#6C63FF',
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  participantCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Shuffle Info
  shuffleInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  // Date Separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  // Messages
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
  },
  ownBubble: {
    borderBottomRightRadius: 6,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ownBubbleInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  otherBubbleInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  ownMessageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  // System Message
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Empty Chat
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Input
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderTopColor: '#6C63FF',
    borderTopWidth: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emojiButton: {
    paddingLeft: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default GroupChatScreen;
