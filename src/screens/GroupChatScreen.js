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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Anonim kullanıcı renkleri
const USER_COLORS = [
  { name: 'Mavi', color: '#3B82F6', bg: '#DBEAFE' },
  { name: 'Kirmizi', color: '#EF4444', bg: '#FEE2E2' },
  { name: 'Yesil', color: '#10B981', bg: '#D1FAE5' },
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
  const [participants, setParticipants] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Kullanıcıya renk ata (sabit, odaya göre)
  const getUserColor = useCallback((userId) => {
    const index = participants.findIndex(p => p.id === userId || p.odanıcıId === userId);
    return USER_COLORS[index % USER_COLORS.length];
  }, [participants]);

  // Mesajları çek
  const fetchMessages = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      // TODO: API'den mesajları çek
      // const response = await chatApi.getMessages(shuffleId);

      // Mock data for now
      const mockMessages = [
        {
          id: '1',
          senderId: 'user1',
          content: 'Merhaba herkese!',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          type: 'text',
        },
        {
          id: '2',
          senderId: 'user2',
          content: 'Selam! Nerede bulusacagiz?',
          createdAt: new Date(Date.now() - 3000000).toISOString(),
          type: 'text',
        },
        {
          id: '3',
          senderId: 'user3',
          content: 'Kadikoy nasil?',
          createdAt: new Date(Date.now() - 2400000).toISOString(),
          type: 'text',
        },
        {
          id: 'system1',
          senderId: 'system',
          content: 'Yesil gruba katildi',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          type: 'system',
        },
        {
          id: '4',
          senderId: 'user1',
          content: 'Kadikoy olabilir, saat kacta?',
          createdAt: new Date(Date.now() - 1200000).toISOString(),
          type: 'text',
        },
      ];

      const mockParticipants = [
        { id: 'user1', odanıcıId: 'user1' },
        { id: 'user2', odanıcıId: 'user2' },
        { id: 'user3', odanıcıId: 'user3' },
        { id: 'user4', odanıcıId: 'user4' },
        { id: 'user5', odanıcıId: 'user5' },
      ];

      setMessages(mockMessages);
      setParticipants(mockParticipants);
      setCurrentUserId('user1'); // Current user mock

    } catch (error) {
      console.error('Failed to fetch messages:', error);
      Alert.alert('Hata', 'Mesajlar yuklenemedi');
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

    try {
      // TODO: API'ye mesaj gönder
      // await chatApi.sendMessage(shuffleId, { content: messageText });

      // Mock: Mesajı listeye ekle
      const newMsg = {
        id: Date.now().toString(),
        senderId: currentUserId,
        content: messageText,
        createdAt: new Date().toISOString(),
        type: 'text',
      };

      setMessages(prev => [...prev, newMsg]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Hata', 'Mesaj gonderilemedi');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  // İlk yükleme ve polling
  useEffect(() => {
    fetchMessages();

    // Her 5 saniyede mesajları kontrol et (basit polling)
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchMessages]);

  // Zaman formatla
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Mesaj renderla
  const renderMessage = ({ item, index }) => {
    // Sistem mesajı
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    const isOwnMessage = item.senderId === currentUserId;
    const userColor = getUserColor(item.senderId);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <View style={[styles.avatar, { backgroundColor: userColor.bg }]}>
            <Text style={[styles.avatarText, { color: userColor.color }]}>
              {userColor.name.charAt(0)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            !isOwnMessage && { borderColor: userColor.color, borderWidth: 1 },
          ]}
        >
          {!isOwnMessage && (
            <Text style={[styles.senderName, { color: userColor.color }]}>
              {userColor.name}
            </Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage && styles.ownMessageText,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage && styles.ownMessageTime,
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Chat yukleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Grup Sohbeti</Text>
          <View style={styles.participantInfo}>
            <Icon name="account-group" size={16} color="#6B7280" />
            <Text style={styles.participantCount}>
              {participants.length} Katilimci
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Icon name="dots-vertical" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Shuffle Info Bar */}
      {shuffleData && (
        <View style={styles.shuffleInfoBar}>
          <Icon name="map-marker" size={16} color="#6C63FF" />
          <Text style={styles.shuffleInfoText} numberOfLines={1}>
            {shuffleData.location || 'Konum belirleniyor...'}
          </Text>
          {shuffleData.scheduledAt && (
            <>
              <Icon name="clock-outline" size={16} color="#6C63FF" style={{ marginLeft: 12 }} />
              <Text style={styles.shuffleInfoText}>
                {new Date(shuffleData.scheduledAt).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Messages List */}
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
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          refreshing={refreshing}
          onRefresh={() => fetchMessages(true)}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="plus" size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Mesaj yaz..."
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
          </View>

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
              <Icon name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  participantCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuButton: {
    padding: 4,
  },
  // Shuffle Info Bar
  shuffleInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
    gap: 6,
  },
  shuffleInfoText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
  },
  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Messages
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // System Message
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default GroupChatScreen;
