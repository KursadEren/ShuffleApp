import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import TextBox from '../components/TextBox';
import Button from '../components/Button';
import { userApi } from '../api/user';

const GENDER_OPTIONS = [
  { label: 'Erkek', value: 'MALE' },
  { label: 'Kadin', value: 'FEMALE' },
  { label: 'Diger', value: 'OTHER' },
];

const LocationSelector = ({ label, location, onPress }) => (
  <Pressable style={styles.locationSelector} onPress={onPress}>
    <View style={styles.locationSelectorLeft}>
      <Icon name="location" size={22} color="#6C63FF" />
      <View style={styles.locationSelectorText}>
        <Text style={styles.locationSelectorLabel}>{label}</Text>
        <Text style={styles.locationSelectorValue} numberOfLines={1}>
          {location?.address || 'Haritadan sec'}
        </Text>
      </View>
    </View>
    <Icon name="chevron-forward" size={20} color="#9CA3AF" />
  </Pressable>
);

const OptionSelector = ({ label, options, value, onChange, multiSelect = false }) => {
  const handleSelect = (optionValue) => {
    if (multiSelect) {
      const currentValues = value || [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
    }
  };

  const isSelected = (optionValue) => {
    if (multiSelect) {
      return (value || []).includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <View style={styles.optionContainer}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const selected = isSelected(optionValue);

          return (
            <Pressable
              key={optionValue}
              style={[styles.optionButton, selected && styles.optionButtonSelected]}
              onPress={() => handleSelect(optionValue)}>
              <Text style={[styles.optionButtonText, selected && styles.optionButtonTextSelected]}>
                {optionLabel}
              </Text>
              {selected && multiSelect && (
                <Icon name="checkmark" size={14} color="#FFFFFF" style={styles.optionCheck} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const EditProfileScreen = ({ navigation, route }) => {
  const existingUser = route.params?.user || {};

  const [firstName, setFirstName] = useState(existingUser.firstName || '');
  const [lastName, setLastName] = useState(existingUser.lastName || '');
  const [nickname, setNickname] = useState(existingUser.nickname || '');
  const [dateOfBirth, setDateOfBirth] = useState(existingUser.dateOfBirth?.split('T')[0] || '');
  const [gender, setGender] = useState(existingUser.gender || '');
  const [myLocation, setMyLocation] = useState(existingUser.location || null);
  const [meetupLocation, setMeetupLocation] = useState(existingUser.meetupLocation || null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Ad gerekli';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Soyad gerekli';
    }

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Dogum tarihi gerekli';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = 'Format: YYYY-MM-DD';
    }

    if (!gender) {
      newErrors.gender = 'Cinsiyet gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await userApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || undefined,
        dateOfBirth: dateOfBirth.trim(),
        gender,
        location: myLocation || undefined,
        meetupLocation: meetupLocation || undefined,
      });

      Alert.alert('Basarili', 'Profil guncellendi', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      let errorMessage = 'Profil guncellenirken bir hata olustu';

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Gecersiz bilgiler';
      } else if (error.response?.status === 409) {
        errorMessage = 'Bu takma ad zaten kullaniliyor';
      }

      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Profili Duzenle</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

          <TextBox
            label="Ad"
            placeholder="Adiniz"
            value={firstName}
            onChangeText={setFirstName}
            error={errors.firstName}
          />

          <TextBox
            label="Soyad"
            placeholder="Soyadiniz"
            value={lastName}
            onChangeText={setLastName}
            error={errors.lastName}
          />

          <TextBox
            label="Takma Ad (Opsiyonel)"
            placeholder="@kullaniciadi"
            value={nickname}
            onChangeText={setNickname}
            error={errors.nickname}
          />

          <TextBox
            label="Dogum Tarihi"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            error={errors.dateOfBirth}
          />
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cinsiyet</Text>

          <OptionSelector
            label="Cinsiyet"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
          />
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konum</Text>

          <LocationSelector
            label="Benim Konumum"
            location={myLocation}
            onPress={() => navigation.navigate('LocationPicker', {
              mode: 'my',
              currentLocation: myLocation,
              onSelect: setMyLocation,
            })}
          />

          <LocationSelector
            label="Bulusmak Istedigim Yer"
            location={meetupLocation}
            onPress={() => navigation.navigate('LocationPicker', {
              mode: 'meetup',
              currentLocation: meetupLocation,
              onSelect: setMeetupLocation,
            })}
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Kaydediliyor...' : 'Kaydet'}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionContainer: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionButtonSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionCheck: {
    marginLeft: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationSelectorText: {
    marginLeft: 12,
    flex: 1,
  },
  locationSelectorLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationSelectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
});

export default EditProfileScreen;
