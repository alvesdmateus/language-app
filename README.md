# Language Learning Flashcard App

A React Native mobile application for learning languages using interactive flashcards with highlighted vocabulary and tooltips.

## Features

### 🎯 Interactive Flashcards
- **Highlighted Words**: Main vocabulary words are highlighted in blue with underline
- **Tooltip on Long Press**: Long press any highlighted word to see its explanation in a tooltip above
- **Flip Animation**: Tap the card to flip it and reveal the translation
- **Smooth Animations**: Spring-based animations for natural, fluid interactions

### 📱 User Interface
- Clean, modern design with card-based layout
- Navigation controls (Previous/Next/Reset)
- Card counter showing progress
- Dismissible instructions on first use
- Responsive design that works on all screen sizes

### 📚 Card Content
- Front: Phrase with highlighted vocabulary word
- Tooltip: Word explanation (appears on long press)
- Back: Original phrase and translation side by side

## How to Use

1. **Long press** the highlighted word to see its definition/explanation
2. **Tap the card** to flip it and see the full translation
3. Use **Previous/Next** buttons to navigate between cards
4. Use **Reset** button to go back to the first card

## Installation & Setup

```bash
# Navigate to the mobile directory
cd mobile

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run android  # Android
npm run ios      # iOS (macOS only)
npm run web      # Web browser
```

## Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   ├── FlashCard.tsx         # Main flashcard component with flip animation
│   │   ├── HighlightedText.tsx   # Text with highlighted words and long-press handling
│   │   └── Tooltip.tsx           # Animated tooltip component
│   ├── data/
│   │   └── flashcards.ts         # Sample flashcard data
│   └── types/
│       └── flashcard.ts          # TypeScript interfaces
├── App.tsx                        # Main application component
└── package.json
```

## Technologies

- **React Native**: Mobile app framework
- **Expo**: Development platform and toolchain
- **TypeScript**: Type-safe JavaScript
- **React Native Animated API**: Smooth animations

## Sample Flashcards

The app includes 5 sample flashcards for learning English-Spanish vocabulary:
- Weather/beautiful
- Groceries
- Speaking fluently
- Delicious food
- Frequent travel

## Customization

To add your own flashcards, edit `mobile/src/data/flashcards.ts`:

```typescript
{
  id: 'unique-id',
  phrase: 'Your phrase here',
  highlightedWord: 'word',
  explanation: 'Word explanation',
  originalText: 'Your phrase here',
  translatedText: 'Translation here',
}
```

## Development

This app was built with a focus on:
- Smooth, natural animations
- Intuitive user interactions
- Clean, maintainable code structure
- Type safety with TypeScript
- Responsive design principles

## License

MIT
