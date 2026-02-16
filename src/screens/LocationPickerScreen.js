import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const LocationPickerScreen = ({ navigation, route }) => {
  const { mode, currentLocation, onSelect } = route.params || {};
  const debounceRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || null);
  const [recentSearches] = useState([
    { id: '1', name: 'Istanbul, Turkiye', lat: 41.0082, lon: 28.9784 },
    { id: '2', name: 'Ankara, Turkiye', lat: 39.9334, lon: 32.8597 },
    { id: '3', name: 'Izmir, Turkiye', lat: 38.4192, lon: 27.1287 },
  ]);

  const searchLocation = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&countrycodes=tr`,
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
        const area = address?.neighbourhood || address?.suburb || address?.district || address?.town || address?.village || '';
        const city = address?.city || address?.state || address?.province || '';
        const country = address?.country || '';

        let displayName = '';
        if (area) displayName += area;
        if (city && city !== area) displayName += (displayName ? ', ' : '') + city;
        if (country) displayName += (displayName ? ', ' : '') + country;

        return {
          id: item.place_id.toString(),
          name: displayName || item.display_name?.split(',').slice(0, 3).join(','),
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          category: item.class,
        };
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocation(text);
    }, 300);
  };

  const handleSelectLocation = (location) => {
    Keyboard.dismiss();
    setSelectedLocation({
      latitude: location.lat,
      longitude: location.lon,
      address: location.name,
    });
    setSearchQuery(location.name);
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (!selectedLocation) return;

    if (onSelect) {
      onSelect(selectedLocation);
    }
    navigation.goBack();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedLocation(null);
  };

  const getLocationIcon = (category) => {
    switch (category) {
      case 'place':
        return 'city';
      case 'boundary':
        return 'map-marker-radius';
      case 'amenity':
        return 'store';
      case 'building':
        return 'office-building';
      default:
        return 'map-marker';
    }
  };

  const renderLocationItem = ({ item }) => (
    <Pressable
      style={styles.locationItem}
      onPress={() => handleSelectLocation(item)}>
      <MCIcon name={getLocationIcon(item.category)} size={22} color="#6C63FF" />
      <View style={styles.locationItemContent}>
        <Text style={styles.locationItemName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.fullName !== item.name && (
          <Text style={styles.locationItemAddress} numberOfLines={1}>
            {item.fullName}
          </Text>
        )}
      </View>
      <Icon name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );

  const renderRecentItem = ({ item }) => (
    <Pressable
      style={styles.recentItem}
      onPress={() => handleSelectLocation(item)}>
      <Icon name="time-outline" size={20} color="#9CA3AF" />
      <Text style={styles.recentItemText}>{item.name}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === 'meetup' ? 'Bulusma Konumu' : 'Konum Sec'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Sehir, ilce veya mahalle ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
          />
          {loading ? (
            <ActivityIndicator size="small" color="#6C63FF" />
          ) : searchQuery.length > 0 ? (
            <Pressable onPress={clearSearch}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Results or Recent */}
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery.length === 0 ? (
        <View style={styles.recentContainer}>
          {/* Selected Location */}
          {selectedLocation && (
            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>Secilen Konum</Text>
              <View style={styles.selectedCard}>
                <MCIcon name="map-marker-check" size={24} color="#10B981" />
                <View style={styles.selectedContent}>
                  <Text style={styles.selectedName}>{selectedLocation.address}</Text>
                  <Text style={styles.selectedCoords}>
                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Recent Searches */}
          <Text style={styles.sectionTitle}>Populer Sehirler</Text>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      ) : !loading && searchQuery.length >= 2 ? (
        <View style={styles.emptyContainer}>
          <MCIcon name="map-search" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Sonuc bulunamadi</Text>
          <Text style={styles.emptySubtext}>Farkli bir arama deneyin</Text>
        </View>
      ) : null}

      {/* Confirm Button */}
      {selectedLocation && (
        <View style={styles.footer}>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Icon name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>Konumu Onayla</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  locationItemContent: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationItemAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  recentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  selectedSection: {
    marginBottom: 20,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  selectedContent: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  selectedCoords: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default LocationPickerScreen;
