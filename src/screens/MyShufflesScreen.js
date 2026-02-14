import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MeetupCard from '../components/MeetupCard';

const TABS = [
  { id: 'active', label: 'Aktif', icon: 'clock-outline' },
  { id: 'completed', label: 'Tamamlanan', icon: 'check-circle-outline' },
];

const MyShufflesScreen = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [shuffles, setShuffles] = useState([]);

  const filteredShuffles = shuffles.filter((shuffle) => {
    if (activeTab === 'active') {
      return shuffle.status === 'waiting' || shuffle.status === 'active';
    }
    return shuffle.status === 'completed';
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
      >
        {filteredShuffles.length === 0 ? (
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
                  purpose={shuffle.purpose}
                  onPress={() => console.log('Shuffle detay:', shuffle.id)}
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
});

export default MyShufflesScreen;
