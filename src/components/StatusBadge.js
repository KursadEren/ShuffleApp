import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  waiting: {
    label: 'Katilimci Bekleniyor',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: 'clock-outline',
  },
  active: {
    label: 'Aktif',
    color: '#10B981',
    bg: '#D1FAE5',
    icon: 'check-circle-outline',
  },
  completed: {
    label: 'Tamamlandi',
    color: '#6B7280',
    bg: '#F3F4F6',
    icon: 'check-all',
  },
  cancelled: {
    label: 'Iptal Edildi',
    color: '#EF4444',
    bg: '#FEE2E2',
    icon: 'close-circle-outline',
  },
  full: {
    label: 'Grup Doldu',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    icon: 'account-group',
  },
};

const StatusBadge = ({ status, size = 'medium', showDot = true, style }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.waiting;

  const sizeStyles = {
    small: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      fontSize: 11,
      dotSize: 6,
    },
    medium: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      fontSize: 13,
      dotSize: 8,
    },
    large: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      dotSize: 10,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        style,
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: config.color,
              width: currentSize.dotSize,
              height: currentSize.dotSize,
              borderRadius: currentSize.dotSize / 2,
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 16,
    gap: 8,
  },
  dot: {
    // Dynamic styles applied inline
  },
  label: {
    fontWeight: '600',
  },
});

export default StatusBadge;
