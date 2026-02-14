import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../components/Button';
import { authApi } from '../api/auth';
import { userApi } from '../api/user';

const GENDER_LABELS = {
  MALE: 'Erkek',
  FEMALE: 'Kadin',
  OTHER: 'Diger',
};

const ProfileSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const ProfileItem = ({ icon, label, value, onPress }) => (
  <Pressable
    style={({ pressed }) => [styles.profileItem, pressed && onPress && styles.profileItemPressed]}
    onPress={onPress}
    disabled={!onPress}>
    <View style={styles.profileItemLeft}>
      <Icon name={icon} size={20} color="#6C63FF" style={styles.profileItemIcon} />
      <Text style={styles.profileItemLabel}>{label}</Text>
    </View>
    <View style={styles.profileItemRight}>
      <Text style={styles.profileItemValue} numberOfLines={1}>
        {value || 'Belirtilmemis'}
      </Text>
      {onPress && <Icon name="chevron-forward" size={18} color="#9CA3AF" />}
    </View>
  </Pressable>
);

const StatCard = ({ icon, value, label }) => (
  <View style={styles.statCard}>
    <Icon name={icon} size={24} color="#6C63FF" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const avatarSize = Math.min(width * 0.22, 90);

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        userApi.getProfile(),
        userApi.getStats().catch(() => null),
      ]);
      setUser(profileData);
      setStats(statsData);
    } catch (error) {
      console.log('Profile fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cikis Yap',
      'Hesabinizdan cikmak istediginize emin misiniz?',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Cikis Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.logout();
            } catch (error) {
              // Token temizleme zaten yapılıyor
            }
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Bilgilerimi Sil',
      'Tum kisisel bilgileriniz (konum, yonelim, tercihler) silinecek. Hesabiniz aktif kalacak. Devam etmek istiyor musunuz?',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Bilgilerimi Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.updateProfile({
                nickname: null,
                city: null,
                meetupLocations: [],
                phone: null,
              });
              Alert.alert('Basarili', 'Bilgileriniz silindi');
              fetchProfile();
            } catch (error) {
              Alert.alert('Hata', 'Bilgiler silinirken bir hata olustu');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabi Sil',
      'Hesabiniz kalici olarak silinecek ve tum verileriniz kaybolacak. Bu islem geri alinamaz!',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Hesabi Sil',
          style: 'destructive',
          onPress: () => {
            // İkinci onay
            Alert.alert(
              'Emin misiniz?',
              'Bu islem geri alinamaz. Hesabinizi silmek istediginizden emin misiniz?',
              [
                { text: 'Vazgec', style: 'cancel' },
                {
                  text: 'Evet, Sil',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await userApi.deleteAccount();
                      await authApi.logout();
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        })
                      );
                    } catch (error) {
                      Alert.alert('Hata', 'Hesap silinirken bir hata olustu');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = () => {
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.avatar,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
            ]}>
            <Text style={[styles.avatarText, { fontSize: avatarSize * 0.35 }]}>
              {getInitials()}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          {user?.nickname && <Text style={styles.userNickname}>@{user.nickname}</Text>}
          <Pressable style={styles.editButton} onPress={handleEditProfile}>
            <Icon name="pencil" size={14} color="#6C63FF" />
            <Text style={styles.editButtonText}>Profili Duzenle</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="people"
            value={stats?.totalMeetups || 0}
            label="Bulusma"
          />
          <StatCard
            icon="star"
            value={stats?.averageRating?.toFixed(1) || '0.0'}
            label="Puan"
          />
          <StatCard
            icon="checkmark-circle"
            value={stats?.completedMeetups || 0}
            label="Tamamlanan"
          />
        </View>

        {/* Personal Info */}
        <ProfileSection title="Kisisel Bilgiler">
          <ProfileItem
            icon="person-outline"
            label="Ad"
            value={user?.firstName}
          />
          <ProfileItem
            icon="person-outline"
            label="Soyad"
            value={user?.lastName}
          />
          <ProfileItem
            icon="at"
            label="Takma Ad"
            value={user?.nickname}
          />
          <ProfileItem
            icon="calendar-outline"
            label="Yas"
            value={calculateAge(user?.dateOfBirth) ? `${calculateAge(user?.dateOfBirth)} yasinda` : null}
          />
          <ProfileItem
            icon="male-female-outline"
            label="Cinsiyet"
            value={GENDER_LABELS[user?.gender]}
          />
        </ProfileSection>

        {/* Location */}
        <ProfileSection title="Konum Bilgileri">
          <ProfileItem
            icon="location-outline"
            label="Benim Konumum"
            value={user?.location?.address}
          />
          <ProfileItem
            icon="navigate-outline"
            label="Bulusmak Istedigim Yer"
            value={user?.meetupLocation?.address}
          />
        </ProfileSection>

        {/* Contact */}
        <ProfileSection title="Iletisim">
          <ProfileItem
            icon="mail-outline"
            label="E-posta"
            value={user?.email}
          />
          <ProfileItem
            icon="call-outline"
            label="Telefon"
            value={user?.phone}
          />
        </ProfileSection>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Profili Duzenle"
            onPress={handleEditProfile}
            variant="primary"
          />
          <View style={styles.actionSpacer} />
          <Button
            title="Cikis Yap"
            onPress={handleLogout}
            variant="outline"
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Tehlikeli Bolge</Text>
          <Pressable style={styles.dangerButton} onPress={handleClearData}>
            <Icon name="trash-outline" size={20} color="#F59E0B" />
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonTitle}>Bilgilerimi Sil</Text>
              <Text style={styles.dangerButtonSubtitle}>Kisisel bilgilerini temizle, hesap kalsin</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
          <Pressable style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Icon name="warning-outline" size={20} color="#EF4444" />
            <View style={styles.dangerButtonContent}>
              <Text style={[styles.dangerButtonTitle, styles.deleteText]}>Hesabi Sil</Text>
              <Text style={styles.dangerButtonSubtitle}>Hesabini kalici olarak sil</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  userNickname: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemPressed: {
    backgroundColor: '#F9FAFB',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    marginRight: 12,
  },
  profileItemLabel: {
    fontSize: 15,
    color: '#374151',
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  profileItemValue: {
    fontSize: 15,
    color: '#6B7280',
    marginRight: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  actionSpacer: {
    height: 12,
  },
  dangerZone: {
    marginTop: 32,
    marginHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerZoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  dangerButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  dangerButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  dangerButtonSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteText: {
    color: '#EF4444',
  },
});

export default ProfileScreen;
