import React, { useState, useRef } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Tooltip from './Tooltip';

interface HighlightedTextProps {
  phrase: string;
  highlightedWord: string;
  explanation: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
  phrase,
  highlightedWord,
  explanation,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const highlightRef = useRef<View>(null);

  const handleLongPress = () => {
    if (highlightRef.current) {
      highlightRef.current.measure((fx, fy, width, height, px, py) => {
        setTooltipPosition({
          x: px + width / 2,
          y: py,
        });
        setTooltipVisible(true);

        // Hide tooltip after 3 seconds
        setTimeout(() => {
          setTooltipVisible(false);
        }, 3000);
      });
    }
  };

  const parts = phrase.split(new RegExp(`(${highlightedWord})`, 'gi'));

  return (
    <View>
      <Text style={styles.phrase}>
        {parts.map((part, index) => {
          const isHighlighted = part.toLowerCase() === highlightedWord.toLowerCase();
          return isHighlighted ? (
            <Pressable
              key={index}
              onLongPress={handleLongPress}
              delayLongPress={300}
            >
              <View ref={highlightRef}>
                <Text style={styles.highlighted}>{part}</Text>
              </View>
            </Pressable>
          ) : (
            <Text key={index} style={styles.normal}>
              {part}
            </Text>
          );
        })}
      </Text>
      <Tooltip
        text={explanation}
        visible={tooltipVisible}
        x={tooltipPosition.x}
        y={tooltipPosition.y}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  phrase: {
    fontSize: 24,
    lineHeight: 36,
    color: '#2C3E50',
    textAlign: 'center',
  },
  normal: {
    color: '#2C3E50',
  },
  highlighted: {
    color: '#3498DB',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    textDecorationColor: '#3498DB',
  },
});

export default HighlightedText;
