import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MeetupCard from '../components/MeetupCard';
import StatusBadge from '../components/StatusBadge';
import { shuffleApi } from '../api';

const TABS = [
  { id: 'chats', label: 'Sohbetlerim', icon: 'chat-outline' },
  { id: 'joined', label: 'Katıldıklarım', icon: 'account-plus-outline' },
  { id: 'created', label: 'Oluşturduklarım', icon: 'plus-circle-outline' },
  { id: 'history', label: 'Geçmiş', icon: 'history' },
];

const MyShufflesScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('chats');
  const [shuffles, setShuffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Shuffle'a tıklandığında - direkt chat'e git
  const handleShufflePress = (shuffle) => {
    navigation.navigate('GroupChat', {
      shuffleId: shuffle.id,
      shuffleData: {
        location: shuffle.location,
        scheduledAt: shuffle.scheduledAt,
        purpose: shuffle.purpose,
        status: shuffle.status,
        joinedCount: shuffle.joinedCount,
        totalSlots: shuffle.totalSlots,
      },
    });
  };

  // Status mapping
  const mapStatus = (backendStatus) => {
    switch (backendStatus) {
      case 'PENDING':
        return 'waiting';
      case 'WAITING':
      case 'FULL':
      case 'READY':
      case 'ACTIVE':
      case 'CONFIRMED':
      case 'IN_PROGRESS':
        return 'active';
      case 'COMPLETED':
      case 'FINISHED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'active';
    }
  };

  // Activity type mapping
  const mapActivityType = (activityType) => {
    const types = {
      COFFEE: 'Kahve icmek',
      WALK: 'Yuruyus yapmak',
      DINNER: 'Yemek yemek',
      DRINKS: 'Icki icmek',
      SPORTS: 'Spor yapmak',
      CULTURAL: 'Kultur/Sanat',
      OTHER: 'Diger',
    };
    return types[activityType] || activityType || 'Bulusma';
  };

  // Tab'a göre API çağır
  const fetchShuffles = useCallback(async (tab, isRefresh = false) => {
    // Response'u parse et
    const parseResponseData = (response) => {
      let shuffleList = [];
      if (response?.data?.posts) {
        shuffleList = response.data.posts;
      } else if (response?.data?.shuffles) {
        shuffleList = response.data.shuffles;
      } else if (Array.isArray(response?.data)) {
        shuffleList = response.data;
      } else if (Array.isArray(response)) {
        shuffleList = response;
      }

      return shuffleList.map((item) => ({
        id: item.id,
        status: mapStatus(item.status),
        totalSlots: item.maxParticipants || 5,
        joinedCount: item.currentParticipants || item.members?.length || 1,
        location: item.locationName || item.location?.name || item.location?.address || 'Konum belirtilmedi',
        distance: item.distance ? item.distance / 1000 : null,
        purpose: mapActivityType(item.activityType),
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt,
        spotsLeft: item.spotsLeft,
        isCreator: item.isCreator,
      }));
    };

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let response;
      switch (tab) {
        case 'chats':
          response = await shuffleApi.getMyChats();
          break;
        case 'joined':
          response = await shuffleApi.getJoinedShuffles();
          break;
        case 'created':
          response = await shuffleApi.getCreatedShuffles();
          break;
        case 'history':
          response = await shuffleApi.getHistory();
          break;
        default:
          response = await shuffleApi.getMyChats();
      }

      console.log(`${tab} response:`, JSON.stringify(response, null, 2));
      const mappedShuffles = parseResponseData(response);
      setShuffles(mappedShuffles);
    } catch (err) {
      console.error('Shuffle fetch error:', err);
      const errorData = err.response?.data;
      if (err.response?.status === 404) {
        setError('Endpoint bulunamadi');
      } else {
        setError(errorData?.message || 'Bulusmalar yuklenemedi');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Tab değiştiğinde veya ilk yüklemede fetch yap
  useEffect(() => {
    fetchShuffles(activeTab);
  }, [activeTab, fetchShuffles]);

  const onRefresh = () => {
    fetchShuffles(activeTab, true);
  };

  const handleTabChange = (tabId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      setShuffles([]); // Tab değişince listeyi temizle
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shuffle'larim</Text>
        <Text style={styles.headerSubtitle}>Bulusmalarim</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => handleTabChange(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#6C63FF' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C63FF']}
            tintColor="#6C63FF"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Yukleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Icon name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Hata olustu</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchShuffles(activeTab)}>
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : shuffles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name={
              activeTab === 'chats' ? 'chat-outline' :
              activeTab === 'history' ? 'history' : 'cards-outline'
            } size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'chats' && 'Aktif sohbetin yok'}
              {activeTab === 'joined' && 'Katildigin shuffle yok'}
              {activeTab === 'created' && 'Olusturdugun shuffle yok'}
              {activeTab === 'history' && 'Gecmis bulusma yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'chats' && 'Bir shuffle\'a katildiginda burada gorunecek'}
              {activeTab === 'joined' && 'Baskalarinin shuffle\'larina katil!'}
              {activeTab === 'created' && 'Ana sayfadan yeni shuffle olustur!'}
              {activeTab === 'history' && 'Tamamlanan bulusmalar burada gorunecek'}
            </Text>
          </View>
        ) : (
          shuffles.map((shuffle) => (
            <View key={shuffle.id} style={styles.cardWrapper}>
              {/* Status Badge */}
              <StatusBadge status={shuffle.status} />

              <MeetupCard
                totalSlots={shuffle.totalSlots}
                joinedCount={shuffle.joinedCount}
                location={shuffle.location}
                distance={shuffle.distance}
                customPurpose={shuffle.purpose}
                scheduledAt={shuffle.scheduledAt}
                onPress={() => handleShufflePress(shuffle)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  tabsScrollView: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexGrow: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#6C63FF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  cardWrapper: {
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MyShufflesScreen;
