import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../components/Button';

const ISTANBUL_REGION = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

const LocationPickerScreen = ({ navigation, route }) => {
  const { mode, currentLocation, onSelect } = route.params || {};
  const mapRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(currentLocation || null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState(
    currentLocation
      ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : ISTANBUL_REGION
  );

  useEffect(() => {
    if (!currentLocation) {
      requestLocationPermission();
    }
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Konum Izni',
            message: 'Konumunuzu haritada gostermek icin izin gerekli',
            buttonPositive: 'Izin Ver',
            buttonNegative: 'Reddet',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } catch (err) {
        console.log('Permission error:', err);
      }
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
        setLoading(false);
      },
      (error) => {
        console.log('Location error:', error);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Reverse geocoding için basit bir yaklaşım
    // Gerçek uygulamada Google Geocoding API kullanılabilir
    setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Uyari', 'Lutfen haritadan bir konum secin');
      return;
    }

    if (onSelect) {
      onSelect({
        ...selectedLocation,
        address,
      });
    }
    navigation.goBack();
  };

  const handleMyLocation = () => {
    getCurrentLocation();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === 'meetup' ? 'Bulusma Konumu Sec' : 'Konumunu Sec'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}>
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              pinColor="#6C63FF"
            />
          )}
        </MapView>

        {/* My Location Button */}
        <Pressable style={styles.myLocationButton} onPress={handleMyLocation}>
          {loading ? (
            <ActivityIndicator size="small" color="#6C63FF" />
          ) : (
            <Icon name="locate" size={24} color="#6C63FF" />
          )}
        </Pressable>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={20} color="#6C63FF" />
          <Text style={styles.infoText}>
            Haritaya tiklayarak konum secin
          </Text>
        </View>
      </View>

      {/* Selected Location */}
      <View style={styles.footer}>
        {selectedLocation ? (
          <View style={styles.selectedInfo}>
            <Icon name="location" size={24} color="#6C63FF" />
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedLabel}>Secilen Konum</Text>
              <Text style={styles.selectedAddress} numberOfLines={1}>
                {address || 'Konum secildi'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedInfo}>
            <Icon name="location-outline" size={24} color="#9CA3AF" />
            <Text style={styles.noSelectionText}>Henuz konum secilmedi</Text>
          </View>
        )}

        <Button
          title="Konumu Onayla"
          onPress={handleConfirm}
          disabled={!selectedLocation}
        />
      </View>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  infoCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  noSelectionText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginLeft: 12,
  },
});

export default LocationPickerScreen;
