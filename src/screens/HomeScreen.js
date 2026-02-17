import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import Dice from '../components/Dice';
import MeetupCard from '../components/MeetupCard';
import { shuffleApi } from '../api';

const MEETUP_PURPOSES = [
  { id: 'coffee', label: 'Kahve icmek', icon: 'coffee', activityType: 'COFFEE' },
  { id: 'walk', label: 'Yuruyus yapmak', icon: 'walk', activityType: 'WALK' },
  { id: 'food', label: 'Yemek yemek', icon: 'food', activityType: 'DINNER' },
  { id: 'drinks', label: 'Icki icmek', icon: 'glass-cocktail', activityType: 'DRINKS' },
  { id: 'sport', label: 'Spor yapmak', icon: 'run', activityType: 'SPORTS' },
  { id: 'cultural', label: 'Kultur/Sanat', icon: 'palette', activityType: 'CULTURAL' },
];

const TIME_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00',
];

const getDateOptions = () => {
  const options = [];
  const today = new Date();
  const dayNames = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
  const monthNames = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    let label;
    if (i === 0) label = 'Bugun';
    else if (i === 1) label = 'Yarin';
    else label = dayNames[date.getDay()];

    options.push({
      id: i.toString(),
      label,
      date: `${date.getDate()} ${monthNames[date.getMonth()]}`,
      fullDate: date,
    });
  }
  return options;
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tumu', icon: 'apps' },
  { id: 'COFFEE', label: 'Kahve', icon: 'coffee' },
  { id: 'WALK', label: 'Yuruyus', icon: 'walk' },
  { id: 'DINNER', label: 'Yemek', icon: 'food' },
  { id: 'DRINKS', label: 'Icki', icon: 'glass-cocktail' },
  { id: 'SPORTS', label: 'Spor', icon: 'run' },
  { id: 'CULTURAL', label: 'Kultur', icon: 'palette' },
];

const HomeScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const diceSize = Math.min(width * 0.3, 120);
  const titleSize = Math.min(width * 0.08, 32);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [participantCount, setParticipantCount] = useState(3);
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [customPurpose, setCustomPurpose] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feed states
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const dateOptions = getDateOptions();

  // Debounce search
  const debounceRef = useRef(null);

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      // Android için izin iste
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Konum İzni',
            message: 'Yakınındaki shuffle\'ları görebilmek için konum izni gerekli.',
            buttonNeutral: 'Daha Sonra',
            buttonNegative: 'İptal',
            buttonPositive: 'Tamam',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocationError('Konum izni verilmedi');
          return null;
        }
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLocation(location);
            setLocationError(null);
            resolve(location);
          },
          (error) => {
            console.error('Location error:', error);
            setLocationError('Konum alınamadı');
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationError('Konum izni hatası');
      return null;
    }
  }, []);

  // Fetch feed
  const fetchFeed = useCallback(async (isRefresh = false, location = null) => {
    try {
      if (isRefresh) {
        setFeedRefreshing(true);
      } else {
        setFeedLoading(true);
      }

      // Konum al (varsa kullan, yoksa yeni al)
      let coords = location || userLocation;
      if (!coords) {
        try {
          coords = await getUserLocation();
        } catch (e) {
          // Konum alınamadı, Sakarya koordinatlarını varsayılan olarak kullan (test için)
          console.log('Could not get location, using default Sakarya coordinates');
          coords = { latitude: 40.741, longitude: 30.401 };
        }
      }

      const params = {
        page: 1,
        limit: 20,
      };

      // Konum varsa ekle
      if (coords) {
        params.latitude = coords.latitude;
        params.longitude = coords.longitude;
        params.radius = 10000; // 10km
      }

      if (activeFilter !== 'all') {
        params.activityType = activeFilter;
      }

      console.log('Fetching feed with params:', JSON.stringify(params));
      const response = await shuffleApi.getFeed(params);
      console.log('Feed response:', JSON.stringify(response, null, 2));
      console.log('Feed response type:', typeof response);
      console.log('Feed data:', response?.data);
      console.log('Feed posts:', response?.data?.posts);

      // Parse response - backend format: { success: true, data: { posts: [...] } }
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

      // Map to frontend format
      const mappedFeed = shuffleList.map((item) => ({
        id: item.id,
        totalSlots: item.maxParticipants || 5,
        joinedCount: item.currentParticipants || item.members?.length || 1,
        location: item.locationName || 'Konum belirtilmedi',
        // Backend metre gönderiyor, km'ye çevir
        distance: item.distance ? item.distance / 1000 : null,
        activityType: item.activityType,
        purpose: mapActivityType(item.activityType),
        scheduledAt: item.scheduledAt,
        createdAt: item.createdAt,
        spotsLeft: item.spotsLeft,
        creatorId: item.creatorId,
      }));

      setFeed(mappedFeed);
    } catch (error) {
      console.error('Feed fetch error:', error);
      console.error('Error response:', error.response?.data);
      // 400 hatası - muhtemelen konum gerekiyor, boş liste göster
      setFeed([]);
    } finally {
      setFeedLoading(false);
      setFeedRefreshing(false);
    }
  }, [activeFilter, userLocation, getUserLocation]);

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

  // Fetch feed on mount and filter change
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onRefresh = () => {
    fetchFeed(true);
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  const handleShufflePress = (shuffle) => {
    // TODO: Navigate to shuffle detail
    console.log('Shuffle pressed:', shuffle.id);
    Alert.alert(
      shuffle.purpose,
      `${shuffle.location}\n${shuffle.joinedCount}/${shuffle.totalSlots} Katilimci`,
      [
        { text: 'Kapat' },
        { text: 'Katil', onPress: () => handleJoinShuffle(shuffle.id) },
      ]
    );
  };

  const handleJoinShuffle = async (shuffleId) => {
    try {
      await shuffleApi.join(shuffleId);
      Alert.alert('Basarili', 'Shuffle\'a katildin!');
      fetchFeed(); // Refresh feed
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Katilirken bir hata olustu';
      Alert.alert('Hata', errorMessage);
    }
  };

  // Dice ref for animation
  const diceRef = useRef(null);

  const handleAnimationComplete = () => {
    Alert.alert(
      'Basarili!',
      'Shuffle olusturuldu. Katilimcilar beklenirken bildirim alacaksin.',
      [{ text: 'Tamam' }]
    );
  };

  const searchLocation = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    setShowResults(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ShuffleApp/1.0',
            'Accept-Language': 'tr,en',
          },
        }
      );
      const data = await response.json();

      const results = data.map((item) => {
        const { address } = item;
        const area = address?.neighbourhood || address?.suburb || address?.district || address?.town || address?.village || address?.city || '';
        const city = address?.city || address?.state || address?.province || '';
        const country = address?.country || '';

        let displayName = '';
        if (area) displayName += area;
        if (city && city !== area) displayName += (displayName ? ', ' : '') + city;
        if (country) displayName += (displayName ? ', ' : '') + country;

        return {
          id: item.place_id,
          name: displayName || item.display_name?.split(',').slice(0, 3).join(','),
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setSelectedLocation(null);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API call
    debounceRef.current = setTimeout(() => {
      searchLocation(text);
    }, 300);
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleDicePress = () => {
    setModalVisible(true);
  };

  const handleStartMatching = async () => {
    if (!selectedLocation) {
      Alert.alert('Hata', 'Lutfen bir konum secin');
      return;
    }

    if (!selectedDate || !selectedTime) {
      Alert.alert('Hata', 'Lutfen tarih ve saat secin');
      return;
    }

    if (!selectedPurpose && !customPurpose.trim()) {
      Alert.alert('Hata', 'Lutfen bulusma amaci secin');
      return;
    }

    // Tarih objesi oluştur (orijinali mutate etmemek için kopyala)
    const selectedDateOption = dateOptions.find(d => d.id === selectedDate);
    const scheduledDate = new Date(selectedDateOption.fullDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // activityType belirleme
    const selectedPurposeObj = MEETUP_PURPOSES.find(p => p.id === selectedPurpose);
    const activityType = selectedPurposeObj?.activityType || 'OTHER';

    // Backend ShufflePost modeline uygun format
    const shuffleData = {
      activityType,
      locationName: String(selectedLocation.name),
      latitude: Number(selectedLocation.lat),
      longitude: Number(selectedLocation.lon),
      scheduledAt: scheduledDate.toISOString(),
      minParticipants: 3,
      maxParticipants: Number(participantCount),
    };

    // description opsiyonel - sadece doluysa ekle
    if (customPurpose.trim()) {
      shuffleData.description = customPurpose.trim();
    }

    setIsSubmitting(true);

    try {
      console.log('Creating shuffle with:', shuffleData);
      const response = await shuffleApi.create(shuffleData);
      console.log('Shuffle response:', response);

      // Close modal and reset form
      setModalVisible(false);
      setSearchQuery('');
      setSelectedLocation(null);
      setSearchResults([]);
      setShowResults(false);
      setParticipantCount(3);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedPurpose(null);
      setCustomPurpose('');
      setShowCustomInput(false);

      // Play the dice merge animation
      setTimeout(() => {
        diceRef.current?.playMerge();
      }, 300);
    } catch (error) {
      console.error('Shuffle error:', error);
      const errorMessage = error.response?.data?.message || 'Bir hata olustu. Lutfen tekrar deneyin.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurposeSelect = (purposeId) => {
    if (purposeId === 'custom') {
      setShowCustomInput(true);
      setSelectedPurpose(null);
    } else {
      setShowCustomInput(false);
      setCustomPurpose('');
      setSelectedPurpose(purposeId);
    }
  };

  const incrementCount = () => {
    if (participantCount < 10) {
      setParticipantCount(participantCount + 1);
    }
  };

  const decrementCount = () => {
    if (participantCount > 3) {
      setParticipantCount(participantCount - 1);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    setSelectedLocation(null);
    setSearchResults([]);
    setShowResults(false);
    setParticipantCount(3);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedPurpose(null);
    setCustomPurpose('');
    setShowCustomInput(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSearchResults([]);
    setShowResults(false);
  };

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleSelectLocation(item)}
    >
      <Icon name="map-marker" size={20} color="#6C63FF" />
      <Text style={styles.locationItemText} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFeedItem = ({ item }) => (
    <MeetupCard
      totalSlots={item.totalSlots}
      joinedCount={item.joinedCount}
      location={item.location}
      distance={item.distance}
      customPurpose={item.purpose}
      scheduledAt={item.scheduledAt}
      onPress={() => handleShufflePress(item)}
      style={styles.feedCard}
    />
  );

  const renderFilterChip = (filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterChip,
        activeFilter === filter.id && styles.filterChipActive,
      ]}
      onPress={() => handleFilterChange(filter.id)}
    >
      <Icon
        name={filter.icon}
        size={18}
        color={activeFilter === filter.id ? '#FFFFFF' : '#6C63FF'}
      />
      <Text
        style={[
          styles.filterChipText,
          activeFilter === filter.id && styles.filterChipTextActive,
        ]}
      >
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
      {/* Hero Section - Original Dice Style */}
      <View style={[styles.heroSection, { height: height * 0.875 }]}>
        {/* Centered Content */}
        <View style={styles.heroCenterContent}>
          <View style={styles.diceContainer}>
            <Dice
              ref={diceRef}
              size={diceSize}
              onPress={handleDicePress}
              onMergeComplete={handleAnimationComplete}
            />
          </View>
          <Text style={[styles.title, { fontSize: titleSize }]}>SHUFFLE</Text>
          <Text style={styles.subtitle}>Yeni insanlarla tanisin</Text>
        </View>

        {/* Scroll Indicator - At Bottom */}
        <View style={styles.scrollIndicator}>
          <Text style={styles.scrollIndicatorText}>Yakinindaki Shuffle'lar</Text>
          <Icon name="chevron-down" size={24} color="#6C63FF" />
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map(renderFilterChip)}
        </ScrollView>
      </View>
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      {feedLoading ? (
        <>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.emptyText}>Yuklenıyor...</Text>
        </>
      ) : locationError || !userLocation ? (
        <>
          <Icon name="map-marker-off" size={64} color="#F59E0B" />
          <Text style={styles.emptyTitle}>Konum gerekli</Text>
          <Text style={styles.emptySubtext}>
            Yakınındaki shuffle'ları görebilmek için konum izni vermen gerekiyor.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: '#F59E0B' }]}
            onPress={async () => {
              const loc = await getUserLocation();
              if (loc) {
                fetchFeed(false, loc);
              }
            }}
          >
            <Icon name="crosshairs-gps" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Konum İzni Ver</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Icon name="cards-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Yakininda shuffle yok</Text>
          <Text style={styles.emptySubtext}>Ilk shuffle'i sen olustur!</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleDicePress}>
            <Icon name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Shuffle Olustur</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={feed}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feedRefreshing}
            onRefresh={onRefresh}
            colors={['#6C63FF']}
            tintColor="#6C63FF"
          />
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulusma Ayarlari</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Location Search */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nerede bulusmak istiyorsun?</Text>
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputContainer}>
                    <Icon name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Konum ara... (ornegin: Kadikoy)"
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                    />
                    {searchLoading ? (
                      <ActivityIndicator size="small" color="#6C63FF" style={styles.searchIndicator} />
                    ) : searchQuery.length > 0 ? (
                      <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                        <Icon name="close-circle" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Search Results */}
                  {showResults && searchResults.length > 0 && (
                    <View style={styles.resultsContainer}>
                      <FlatList
                        data={searchResults}
                        renderItem={renderLocationItem}
                        keyExtractor={(item) => item.id.toString()}
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled={false}
                      />
                    </View>
                  )}

                  {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                    <View style={styles.noResultsContainer}>
                      <Icon name="map-marker-off" size={24} color="#9CA3AF" />
                      <Text style={styles.noResultsText}>Sonuc bulunamadi</Text>
                    </View>
                  )}
                </View>

                {/* Selected Location Display */}
                {selectedLocation && (
                  <View style={styles.selectedLocationContainer}>
                    <Icon name="map-marker-check" size={22} color="#10B981" />
                    <Text style={styles.selectedLocationText}>{selectedLocation.name}</Text>
                    <TouchableOpacity onPress={clearSearch}>
                      <Icon name="close" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Participant Count */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kac kisi ile bulusmak istiyorsun?</Text>
                <Text style={styles.sectionHint}>En az 3 kisi olmali</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      participantCount <= 3 && styles.counterButtonDisabled,
                    ]}
                    onPress={decrementCount}
                    disabled={participantCount <= 3}
                  >
                    <Icon
                      name="minus"
                      size={24}
                      color={participantCount <= 3 ? '#D1D5DB' : '#6C63FF'}
                    />
                  </TouchableOpacity>
                  <View style={styles.counterValue}>
                    <Text style={styles.counterValueText}>{participantCount}</Text>
                    <Text style={styles.counterValueLabel}>kisi</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      participantCount >= 10 && styles.counterButtonDisabled,
                    ]}
                    onPress={incrementCount}
                    disabled={participantCount >= 10}
                  >
                    <Icon
                      name="plus"
                      size={24}
                      color={participantCount >= 10 ? '#D1D5DB' : '#6C63FF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hangi gun?</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateScrollContainer}
                >
                  {dateOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dateOption,
                        selectedDate === option.id && styles.dateOptionSelected,
                      ]}
                      onPress={() => setSelectedDate(option.id)}
                    >
                      <Text
                        style={[
                          styles.dateOptionLabel,
                          selectedDate === option.id && styles.dateOptionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.dateOptionDate,
                          selectedDate === option.id && styles.dateOptionDateSelected,
                        ]}
                      >
                        {option.date}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Time Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Saat kac?</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeScrollContainer}
                >
                  {TIME_OPTIONS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        selectedTime === time && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedTime === time && styles.timeOptionTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Purpose Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ne icin bulusmak istiyorsun?</Text>
                <View style={styles.purposeGrid}>
                  {MEETUP_PURPOSES.map((purpose) => (
                    <TouchableOpacity
                      key={purpose.id}
                      style={[
                        styles.purposeButton,
                        selectedPurpose === purpose.id && styles.purposeButtonSelected,
                      ]}
                      onPress={() => handlePurposeSelect(purpose.id)}
                    >
                      <Icon
                        name={purpose.icon}
                        size={24}
                        color={selectedPurpose === purpose.id ? '#FFFFFF' : '#6C63FF'}
                      />
                      <Text
                        style={[
                          styles.purposeButtonText,
                          selectedPurpose === purpose.id && styles.purposeButtonTextSelected,
                        ]}
                      >
                        {purpose.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.purposeButton,
                      showCustomInput && styles.purposeButtonSelected,
                    ]}
                    onPress={() => handlePurposeSelect('custom')}
                  >
                    <Icon
                      name="plus-circle"
                      size={24}
                      color={showCustomInput ? '#FFFFFF' : '#6C63FF'}
                    />
                    <Text
                      style={[
                        styles.purposeButtonText,
                        showCustomInput && styles.purposeButtonTextSelected,
                      ]}
                    >
                      Diger
                    </Text>
                  </TouchableOpacity>
                </View>

                {showCustomInput && (
                  <TextInput
                    style={styles.customPurposeInput}
                    placeholder="Bulusma amacini yaz..."
                    placeholderTextColor="#9CA3AF"
                    value={customPurpose}
                    onChangeText={setCustomPurpose}
                  />
                )}
              </View>
            </ScrollView>

            {/* Start Button */}
            <TouchableOpacity
              style={[
                styles.startButton,
                (!selectedLocation || !selectedDate || !selectedTime || isSubmitting) && styles.startButtonDisabled,
              ]}
              onPress={handleStartMatching}
              disabled={!selectedLocation || !selectedDate || !selectedTime || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="shuffle-variant" size={24} color="#FFFFFF" />
              )}
              <Text style={styles.startButtonText}>
                {isSubmitting ? 'Gonderiliyor...' : 'Eslesme Baslat'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  feedContent: {
    paddingBottom: 20,
  },
  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
  },
  heroCenterContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceContainer: {
    marginBottom: 32,
  },
  title: {
    fontWeight: '700',
    color: '#6C63FF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  scrollIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginBottom: 4,
  },
  // Filter Section
  filterSection: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C63FF',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Feed
  feedCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  searchContainer: {
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  searchIndicator: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  locationItemText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 10,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#059669',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  counterValue: {
    alignItems: 'center',
  },
  counterValueText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6C63FF',
  },
  counterValueLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -4,
  },
  dateScrollContainer: {
    paddingRight: 20,
    gap: 10,
  },
  dateOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    minWidth: 80,
  },
  dateOptionSelected: {
    backgroundColor: '#6C63FF',
  },
  dateOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateOptionLabelSelected: {
    color: '#FFFFFF',
  },
  dateOptionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  dateOptionDateSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeScrollContainer: {
    paddingRight: 20,
    gap: 8,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  timeOptionSelected: {
    backgroundColor: '#6C63FF',
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  purposeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    gap: 6,
  },
  purposeButtonSelected: {
    backgroundColor: '#6C63FF',
  },
  purposeButtonText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  purposeButtonTextSelected: {
    color: '#FFFFFF',
  },
  customPurposeInput: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
