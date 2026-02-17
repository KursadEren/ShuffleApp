import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MeetupCard from '../components/MeetupCard';
import { shuffleApi } from '../api';

const TABS = [
  { id: 'active', label: 'Aktif', icon: 'clock-outline' },
  { id: 'completed', label: 'Tamamlanan', icon: 'check-circle-outline' },
];

const MyShufflesScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('active');
  const [shuffles, setShuffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Shuffle'a tıklandığında
  const handleShufflePress = (shuffle) => {
    if (shuffle.status === 'active') {
      // Aktif shuffle - Chat'e git
      navigation.navigate('GroupChat', {
        shuffleId: shuffle.id,
        shuffleData: {
          location: shuffle.location,
          scheduledAt: shuffle.scheduledAt,
          purpose: shuffle.purpose,
        },
      });
    } else if (shuffle.status === 'waiting') {
      // Bekleyen shuffle - Bilgi göster
      Alert.alert(
        'Katilimci Bekleniyor',
        `${shuffle.joinedCount}/${shuffle.totalSlots} kisi katildi. Grup tamamlaninca sohbet acilacak.`,
        [{ text: 'Tamam' }]
      );
    } else {
      // Tamamlanan shuffle - Detay göster
      Alert.alert(
        'Bulusma Tamamlandi',
        `${shuffle.location} konumunda gerceklesen bulusma.`,
        [{ text: 'Tamam' }]
      );
    }
  };
  const [error, setError] = useState(null);

  const fetchMyShuffles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await shuffleApi.getMyShuffles();
      console.log('My Shuffles response:', JSON.stringify(response, null, 2));

      // Backend response formatı: { success: true, data: { posts: [...] } }
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

      console.log('Shuffle list:', shuffleList);

      // Backend'den gelen veriyi map'le
      const mappedShuffles = shuffleList.map((item) => ({
        id: item.id,
        status: mapStatus(item.status),
        totalSlots: item.maxParticipants || 5,
        joinedCount: item.currentParticipants || item.members?.length || 1,
        location: item.locationName || 'Konum belirtilmedi',
        distance: null,
        purpose: mapActivityType(item.activityType),
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt,
        spotsLeft: item.spotsLeft,
        isCreator: item.isCreator,
      }));

      setShuffles(mappedShuffles);
    } catch (err) {
      console.error('Shuffle fetch error:', err);
      console.error('Full error response:', JSON.stringify(err.response?.data, null, 2));

      const errorData = err.response?.data;
      if (errorData?.errors) {
        // Validation errors
        console.error('Validation errors:', errorData.errors);
        setError('Validation hatasi: ' + JSON.stringify(errorData.errors));
      } else if (err.response?.status === 404) {
        setError('Endpoint bulunamadi');
      } else {
        setError(errorData?.message || 'Bulusmalar yuklenemedi');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Status mapping
  const mapStatus = (backendStatus) => {
    switch (backendStatus) {
      case 'PENDING':
      case 'WAITING':
        return 'waiting';
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
        return 'waiting';
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

  useEffect(() => {
    fetchMyShuffles();
  }, [fetchMyShuffles]);

  const onRefresh = () => {
    fetchMyShuffles(true);
  };

  const filteredShuffles = shuffles.filter((shuffle) => {
    if (activeTab === 'active') {
      return shuffle.status === 'waiting' || shuffle.status === 'active';
    }
    return shuffle.status === 'completed' || shuffle.status === 'cancelled';
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return { label: 'Katilimci Bekleniyor', color: '#F59E0B', bg: '#FEF3C7' };
      case 'active':
        return { label: 'Aktif', color: '#10B981', bg: '#D1FAE5' };
      case 'completed':
        return { label: 'Tamamlandi', color: '#6B7280', bg: '#F3F4F6' };
      default:
        return { label: '', color: '#6B7280', bg: '#F3F4F6' };
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
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={20}
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
      </View>

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
            <Text style={styles.loadingText}>Bulusmalar yukleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Icon name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Hata olustu</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchMyShuffles()}>
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : filteredShuffles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="cards-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active'
                ? 'Aktif bulusman yok'
                : 'Tamamlanan bulusman yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'Ana sayfadan yeni bir shuffle baslat!'
                : 'Bulusmalarin burada gorunecek'}
            </Text>
          </View>
        ) : (
          filteredShuffles.map((shuffle) => {
            const statusBadge = getStatusBadge(shuffle.status);
            return (
              <View key={shuffle.id} style={styles.cardWrapper}>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusBadge.bg },
                  ]}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: statusBadge.color }]}
                  />
                  <Text style={[styles.statusText, { color: statusBadge.color }]}>
                    {statusBadge.label}
                  </Text>
                </View>

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
            );
          })
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
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
