import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dice from '../components/Dice';

const HomeScreen = () => {
  const { width } = useWindowDimensions();
  const diceSize = Math.min(width * 0.3, 120);
  const titleSize = Math.min(width * 0.08, 32);

  const handleDicePress = () => {
    console.log('Dice pressed! - Start matching...');
    // TODO: Implement matching logic
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.diceContainer}>
          <Dice size={diceSize} onPress={handleDicePress} />
        </View>
        <Text style={[styles.title, { fontSize: titleSize }]}>SHUFFLE</Text>
        <Text style={styles.subtitle}>Yeni insanlarla tanisin</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceContainer: {
    marginBottom: 32,
  },
  title: {
    fontWeight: '700',
    color: '#6C63FF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default HomeScreen;
