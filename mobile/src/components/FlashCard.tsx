import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { FlashCard as FlashCardType } from '../types/flashcard';
import HighlightedText from './HighlightedText';

interface FlashCardProps {
  card: FlashCardType;
}

const FlashCard: React.FC<FlashCardProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 180;

    Animated.spring(flipAnimation, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  return (
    <Pressable onPress={flipCard} style={styles.container}>
      <View>
        {/* Front of card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFront,
            {
              opacity: frontOpacity,
              transform: [{ rotateY: frontInterpolate }],
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={styles.label}>Tap to see translation</Text>
            <View style={styles.phraseContainer}>
              <HighlightedText
                phrase={card.phrase}
                highlightedWord={card.highlightedWord}
                explanation={card.explanation}
              />
            </View>
            <Text style={styles.hint}>Long press the highlighted word for help</Text>
          </View>
        </Animated.View>

        {/* Back of card */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              opacity: backOpacity,
              transform: [{ rotateY: backInterpolate }],
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={styles.backLabel}>Translation</Text>
            <View style={styles.translationContainer}>
              <Text style={styles.originalText}>{card.originalText}</Text>
              <View style={styles.divider} />
              <Text style={styles.translatedText}>{card.translatedText}</Text>
            </View>
            <Text style={styles.tapHint}>Tap to flip back</Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  cardBack: {
    backgroundColor: '#3498DB',
    position: 'absolute',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
    marginTop: 10,
  },
  phraseContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  hint: {
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
  backLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 10,
  },
  translationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  originalText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  divider: {
    width: '80%',
    height: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
    marginVertical: 15,
  },
  translatedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  tapHint: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 10,
  },
});

export default FlashCard;
