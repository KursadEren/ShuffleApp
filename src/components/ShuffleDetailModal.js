import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const ShuffleDetailModal = ({
  visible,
  onClose,
  onJoin,
  shuffle,
}) => {
  if (!shuffle) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dayNames = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      if (date.toDateString() === now.toDateString()) {
        return `Bugun, ${hours}:${minutes}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Yarin, ${hours}:${minutes}`;
      } else {
        return `${date.getDate()} ${dayNames[date.getDay()]}, ${hours}:${minutes}`;
      }
    } catch {
      return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header with gradient effect */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Icon name="account-group" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>{shuffle.purpose}</Text>
                <Text style={styles.subtitle}>
                  {shuffle.joinedCount}/{shuffle.totalSlots} Katilimci
                </Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Location */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="map-marker" size={20} color="#6C63FF" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Konum</Text>
                    <Text style={styles.infoValue}>{shuffle.location}</Text>
                  </View>
                </View>

                {/* Date */}
                {shuffle.scheduledAt && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Icon name="calendar-clock" size={20} color="#10B981" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Tarih</Text>
                      <Text style={styles.infoValue}>{formatDate(shuffle.scheduledAt)}</Text>
                    </View>
                  </View>
                )}

                {/* Distance */}
                {shuffle.distance && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Icon name="map-marker-distance" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Uzaklik</Text>
                      <Text style={styles.infoValue}>
                        {shuffle.distance < 1
                          ? `${Math.round(shuffle.distance * 1000)} m`
                          : `${shuffle.distance.toFixed(1)} km`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Participant dots */}
                <View style={styles.participantSection}>
                  <Text style={styles.participantLabel}>Katilimcilar</Text>
                  <View style={styles.participantDots}>
                    {[...Array(shuffle.totalSlots)].map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          index < shuffle.joinedCount ? styles.dotFilled : styles.dotEmpty,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeButtonText}>Kapat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => {
                    onJoin(shuffle.id);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="account-plus" size={20} color="#FFFFFF" />
                  <Text style={styles.joinButtonText}>Katil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#6C63FF',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  participantLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  participantDots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotFilled: {
    backgroundColor: '#10B981',
  },
  dotEmpty: {
    backgroundColor: '#E5E7EB',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShuffleDetailModal;
