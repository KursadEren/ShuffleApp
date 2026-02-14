import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

const TextBox = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeButton}>
            <Text style={styles.eyeText}>
              {isPasswordVisible ? 'Gizle' : 'Goster'}
            </Text>
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 14,
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

export default TextBox;
