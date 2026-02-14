import { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    if (fullWidth) baseStyle.push(styles.fullWidth);

    if (disabled) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant]);
      if (isPressed) baseStyle.push(styles[`${variant}Pressed`]);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    } else if (variant === 'outline' || variant === 'ghost') {
      baseStyle.push(styles.textOutline);
    } else {
      baseStyle.push(styles.textLight);
    }

    return baseStyle;
  };

  const getLoaderColor = () => {
    if (variant === 'outline' || variant === 'ghost') return '#6C63FF';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}>
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },

  // Sizes
  small: {
    height: 40,
    paddingHorizontal: 16,
  },
  medium: {
    height: 52,
    paddingHorizontal: 24,
  },
  large: {
    height: 58,
    paddingHorizontal: 32,
  },

  // Variants
  primary: {
    backgroundColor: '#6C63FF',
  },
  primaryPressed: {
    backgroundColor: '#5B54E8',
  },
  secondary: {
    backgroundColor: '#FF6B9D',
  },
  secondaryPressed: {
    backgroundColor: '#E85A8A',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  outlinePressed: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  disabled: {
    backgroundColor: '#E5E7EB',
  },

  // Text
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: '#6C63FF',
  },
  textDisabled: {
    color: '#9CA3AF',
  },
});

export default Button;
