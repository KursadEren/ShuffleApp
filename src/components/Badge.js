import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Badge = ({
  label,
  icon,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const colors = {
    primary: { bg: '#6C63FF', text: '#FFF' },
    success: { bg: '#10B981', text: '#FFF' },
    warning: { bg: '#F59E0B', text: '#FFF' },
    danger: { bg: '#EF4444', text: '#FFF' },
    info: { bg: '#0EA5E9', text: '#FFF' },
    successSoft: { bg: '#D1FAE5', text: '#059669' },
    warningSoft: { bg: '#FEF3C7', text: '#D97706' },
    glass: { bg: 'rgba(255,255,255,0.2)', text: '#FFF' },
  };

  const sizes = {
    small: { py: 5, px: 10, font: 11, icon: 13 },
    medium: { py: 7, px: 14, font: 13, icon: 16 },
    large: { py: 10, px: 18, font: 15, icon: 18 },
  };

  const c = colors[variant] || colors.primary;
  const s = sizes[size] || sizes.medium;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={s.icon} color={c.text} />}
      <Text style={[styles.text, { color: c.text, fontSize: s.font }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
