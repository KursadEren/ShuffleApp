import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PURPOSE_ICONS = {
  coffee: 'coffee',
  walk: 'walk',
  food: 'food',
  chat: 'chat',
  study: 'book-open-variant',
  sport: 'run',
};

const PURPOSE_LABELS = {
  coffee: 'Kahve icmek',
  walk: 'Yuruyus yapmak',
  food: 'Yemek yemek',
  chat: 'Sohbet etmek',
  study: 'Birlikte calismak',
  sport: 'Spor yapmak',
};

const MeetupCard = ({
  totalSlots = 5,
  joinedCount = 0,
  location = '',
  distance = null,
  purpose = 'coffee',
  customPurpose = '',
  imageSource = null,
  scheduledAt = null,
  onPress,
  style,
}) => {
  const availableSlots = totalSlots - joinedCount;
  const purposeIcon = PURPOSE_ICONS[purpose] || 'account-group';
  const purposeLabel = customPurpose || PURPOSE_LABELS[purpose] || purpose;

  const formatScheduledDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayNames = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
      const monthNames = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      if (date.toDateString() === now.toDateString()) {
        return `Bugun, ${timeStr}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Yarin, ${timeStr}`;
      } else {
        return `${date.getDate()} ${monthNames[date.getMonth()]}, ${dayNames[date.getDay()]} - ${timeStr}`;
      }
    } catch {
      return null;
    }
  };

  const formatDistance = (km) => {
    if (km === null || km === undefined) return null;
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : null}
        <View style={[styles.overlay, !imageSource && styles.noImageOverlay]} />

        <View style={styles.imageContent}>
          <View style={styles.slotsBadge}>
            <Icon name="account-group" size={18} color="#FFFFFF" />
            <Text style={styles.slotsBadgeText}>{totalSlots} Kisilik</Text>
          </View>

          <View style={styles.participantInfo}>
            <View style={styles.participantRow}>
              <View style={styles.participantDots}>
                {[...Array(totalSlots)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index < joinedCount ? styles.dotFilled : styles.dotEmpty,
                    ]}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.joinedText}>
              {joinedCount}/{totalSlots} Katilimci
            </Text>

            {availableSlots > 0 ? (
              <View style={styles.availableBadge}>
                <Icon name="account-plus" size={16} color="#10B981" />
                <Text style={styles.availableText}>
                  {availableSlots} Kisilik Yer Var
                </Text>
              </View>
            ) : (
              <View style={styles.fullBadge}>
                <Icon name="check-circle" size={16} color="#F59E0B" />
                <Text style={styles.fullText}>Grup Tamamlandi</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Scheduled Date */}
        {scheduledAt && formatScheduledDate(scheduledAt) && (
          <View style={styles.infoRow}>
            <Icon name="calendar-clock" size={20} color="#10B981" />
            <Text style={styles.scheduledText}>
              {formatScheduledDate(scheduledAt)}
            </Text>
          </View>
        )}

        {/* Location */}
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={20} color="#6C63FF" />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {/* Distance */}
        {distance !== null && (
          <View style={styles.infoRow}>
            <Icon name="map-marker-distance" size={20} color="#9CA3AF" />
            <Text style={styles.distanceText}>
              {formatDistance(distance)} uzaklikta
            </Text>
          </View>
        )}

        {/* Purpose */}
        <View style={styles.purposeContainer}>
          <View style={styles.purposeBadge}>
            <Icon name={purposeIcon} size={18} color="#FFFFFF" />
            <Text style={styles.purposeText}>{purposeLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(108, 99, 255, 0.75)',
  },
  noImageOverlay: {
    backgroundColor: '#6C63FF',
  },
  imageContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  slotsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  slotsBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  participantInfo: {
    alignItems: 'center',
  },
  participantRow: {
    marginBottom: 8,
  },
  participantDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFilled: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  joinedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  availableText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  fullText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  scheduledText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  purposeContainer: {
    marginTop: 4,
  },
  purposeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  purposeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MeetupCard;
