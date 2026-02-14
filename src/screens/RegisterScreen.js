import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextBox from '../components/TextBox';
import Button from '../components/Button';
import Dice from '../components/Dice';
import { authApi } from '../api/auth';

const GENDER_OPTIONS = [
  { label: 'Cinsiyet Seciniz', value: '' },
  { label: 'Erkek', value: 'MALE' },
  { label: 'Kadin', value: 'FEMALE' },
  { label: 'Diger', value: 'OTHER' },
];

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
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

    if (!email.trim()) {
      newErrors.email = 'E-posta gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Gecerli bir e-posta girin';
    }

    if (!password) {
      newErrors.password = 'Sifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Sifre en az 6 karakter olmali';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Sifre tekrari gerekli';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Sifreler eslesmiyor';
    }

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Dogum tarihi gerekli';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      newErrors.dateOfBirth = 'Format: YYYY-MM-DD (ornek: 1990-05-15)';
    }

    if (!gender) {
      newErrors.gender = 'Cinsiyet gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        dateOfBirth: dateOfBirth.trim(),
        gender: gender,
      });

      // Kayit basarili, ana ekrana yonlendir
      navigation.replace('Main');
    } catch (error) {
      let errorMessage = 'Kayit sirasinda bir hata olustu';

      if (error.response) {
        // Sunucudan gelen hata
        const status = error.response.status;
        const data = error.response.data;

        if (status === 409) {
          errorMessage = 'Bu e-posta adresi zaten kayitli';
        } else if (status === 400) {
          errorMessage = data?.message || 'Gecersiz bilgiler';
        } else if (status === 500) {
          errorMessage = 'Sunucu hatasi, lutfen daha sonra tekrar deneyin';
        }
      } else if (error.request) {
        // Network hatasi
        errorMessage = 'Baglanti hatasi, internet baglantinizi kontrol edin';
      }

      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.diceContainer}>
            <Dice />
          </View>
          <Text style={styles.logo}>SHUFFLE</Text>
          <Text style={styles.subtitle}>Yeni hesap olustur</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <TextBox
                label="Ad"
                placeholder="Adiniz"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
              />
            </View>
            <View style={styles.halfInput}>
              <TextBox
                label="Soyad"
                placeholder="Soyadiniz"
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
              />
            </View>
          </View>

          <TextBox
            label="E-posta"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />

          <TextBox
            label="Dogum Tarihi"
            placeholder="YYYY-MM-DD (ornek: 1990-05-15)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            error={errors.dateOfBirth}
          />

          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>Cinsiyet</Text>
            <View style={styles.genderOptions}>
              {GENDER_OPTIONS.filter(opt => opt.value !== '').map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => setGender(option.value)}>
                  <Text
                    style={[
                      styles.genderOptionText,
                      gender === option.value && styles.genderOptionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          <TextBox
            label="Sifre"
            placeholder="En az 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <TextBox
            label="Sifre Tekrar"
            placeholder="Sifrenizi tekrar girin"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title="Kayit Ol"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Zaten hesabiniz var mi? Giris yapin"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  diceContainer: {
    marginBottom: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6C63FF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#EEF2FF',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
});

export default RegisterScreen;
