import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Dice from '../components/Dice';

const MEETUP_PURPOSES = [
  { id: 'coffee', label: 'Kahve icmek', icon: 'coffee' },
  { id: 'walk', label: 'Yuruyus yapmak', icon: 'walk' },
  { id: 'food', label: 'Yemek yemek', icon: 'food' },
  { id: 'chat', label: 'Sohbet etmek', icon: 'chat' },
  { id: 'study', label: 'Birlikte calismak', icon: 'book-open-variant' },
  { id: 'sport', label: 'Spor yapmak', icon: 'run' },
];

const HomeScreen = () => {
  const { width } = useWindowDimensions();
  const diceSize = Math.min(width * 0.3, 120);
  const titleSize = Math.min(width * 0.08, 32);

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

  // Debounce search
  const debounceRef = React.useRef(null);

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

  const handleStartMatching = () => {
    if (!selectedLocation) {
      alert('Lutfen bir konum secin');
      return;
    }

    if (!selectedPurpose && !customPurpose.trim()) {
      alert('Lutfen bulusma amaci secin');
      return;
    }

    const matchingData = {
      location: {
        name: selectedLocation.name,
        coordinates: {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lon,
        },
      },
      participantCount,
      purpose: selectedPurpose || customPurpose.trim(),
    };

    console.log('Starting matching with:', matchingData);
    setModalVisible(false);
    // TODO: Implement matching logic
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.diceContainer}>
          <Dice size={diceSize} onPress={handleDicePress} />
        </View>
        <Text style={[styles.title, { fontSize: titleSize }]}>SHUFFLE</Text>
        <Text style={styles.subtitle}>Yeni insanlarla tanisin</Text>
      </View>

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
              style={[styles.startButton, !selectedLocation && styles.startButtonDisabled]}
              onPress={handleStartMatching}
              disabled={!selectedLocation}
            >
              <Icon name="shuffle-variant" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Eslesme Baslat</Text>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
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
