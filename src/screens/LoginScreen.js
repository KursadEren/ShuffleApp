import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextBox from '../components/TextBox';
import Button from '../components/Button';
import Dice from '../components/Dice';
import { authApi } from '../api/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await authApi.login({
        email: email.trim().toLowerCase(),
        password: password,
      });

      // Giris basarili, ana ekrana yonlendir
      navigation.replace('Main');
    } catch (error) {
      let errorMessage = 'Giris sirasinda bir hata olustu';

      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          errorMessage = 'E-posta veya sifre hatali';
        } else if (status === 404) {
          errorMessage = 'Bu e-posta ile kayitli hesap bulunamadi';
        } else if (status === 500) {
          errorMessage = 'Sunucu hatasi, lutfen daha sonra tekrar deneyin';
        }
      } else if (error.request) {
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
          <Text style={styles.subtitle}>Yeni insanlarla tanisin</Text>
        </View>

        <View style={styles.form}>
          <TextBox
            label="E-posta"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />

          <TextBox
            label="Sifre"
            placeholder="Sifrenizi girin"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Giris Yap"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />

          <Button
            title="Hesabiniz yok mu? Kayit olun"
            onPress={() => navigation.navigate('Register')}
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
    marginBottom: 48,
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
});

export default LoginScreen;
