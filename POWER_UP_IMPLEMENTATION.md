# Power-Up System Implementation Summary

## ✅ Completed Backend Implementation

### 1. Database Schema (`backend/prisma/schema.prisma`)
- ✅ Added `PowerUpType` enum (NONE, FREEZE, BURN)
- ✅ Added `powerUpState` JSON field to `Match` model
- ✅ Added power-up tracking fields to `MatchResult`:
  - `equippedPowerUp`: PowerUpType
  - `powerUpUsages`: JSON array
  - `timePenaltyMs`: Int (for freeze penalty)

### 2. Backend Service (`backend/src/services/powerUpService.ts`)
Created comprehensive power-up service with:
- ✅ `initializePowerUpState()` - Initialize power-up state for match
- ✅ `canUsePowerUp()` - Check if power-up is off cooldown
- ✅ `usePowerUp()` - Execute power-up and handle interactions
- ✅ `handlePowerUpInteractions()` - Freeze/Burn cancellation logic
- ✅ `getActiveEffects()` - Get active effects for player/question
- ✅ `getTimerModifier()` - Calculate timer speed (0 = frozen, 1 = normal, 2 = burning)
- ✅ `clearQuestionEffects()` - Remove effects when question ends
- ✅ `recordPowerUpUsage()` - Track usage in match result
- ✅ `calculateTimePenalty()` - Calculate freeze time penalties
- ✅ `getCooldownRemaining()` - Get cooldown time in seconds

### 3. WebSocket Events (`backend/src/services/socketService.ts`)
Added socket event handler:
- ✅ `game:use_power_up` - Player uses power-up
  - Validates power-up enabled
  - Calls powerUpService.usePowerUp()
  - Records usage
  - Emits `game:power_up_used` to user (with cooldown)
  - Emits `game:power_up_effect` to opponent (with effect details)
  - Emits `game:power_up_error` on failure

### 4. Matchmaking Service (`backend/src/services/matchmakingService.ts`)
- ✅ Added `PowerUpType` import
- ✅ Updated `LobbyPlayer` interface with `equippedPowerUp` field
- ✅ Updated `joinLobby()` to accept `equippedPowerUp` parameter
- ✅ Initialize power-up state when creating match (if enabled)
- ✅ Pass equipped power-ups to `powerUpService.initializePowerUpState()`

### 5. Match Controller (`backend/src/controllers/matchController.ts`)
- ✅ Added `PowerUpType` import
- ✅ Updated `findMatch()` to accept `equippedPowerUp` from request body
- ✅ Pass `equippedPowerUp` to `matchmakingService.joinLobby()`

## ✅ Completed Frontend Implementation

### 1. Types (`mobile/src/types/index.ts`)
Added enums and interfaces:
- ✅ `PowerUpType` enum (NONE, FREEZE, BURN)
- ✅ `PowerUpState` interface
- ✅ `ActiveEffect` interface
- ✅ Updated `Match` interface with `powerUpState` field
- ✅ Updated `MatchResult` interface with power-up fields
- ✅ Added `PowerUpSelection` screen to navigation types

### 2. API Service (`mobile/src/services/api.ts`)
- ✅ Updated `matchService.findMatch()` to accept:
  - `equippedPowerUp?: string`
  - `isAsync?: boolean`

### 3. Power-Up Selection Screen (`mobile/src/screens/PowerUpSelectionScreen.tsx`)
Created comprehensive power-up selection UI:
- ✅ Three power-up cards (Freeze ❄️, Burn 🔥, None ⭕)
- ✅ Detailed descriptions and mechanics
- ✅ Pros/cons for each power-up
- ✅ Visual selection with color-coded borders
- ✅ Info box explaining power-up mechanics
- ✅ Start match button with selected power-up
- ✅ Integrated with matchmaking API

## 🚧 Pending: GameScreen Power-Up UI Integration

To complete the power-up system, the `GameScreen.tsx` needs the following additions:

### State Variables to Add
```typescript
// Power-up state
const [powerUpCooldown, setPowerUpCooldown] = useState(0);
const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
const [timerModifier, setTimerModifier] = useState(1.0);
const [powerUpUsed, setPowerUpUsed] = useState(false);
const powerUpAnimRef = useRef(new Animated.Value(0)).current;

// Get equipped power-up from match state
const userId = '...'; // Get from auth context
const equippedPowerUp = match.powerUpState?.[userId]?.equipped || PowerUpType.NONE;
const powerUpsEnabled = match.powerUpsEnabled;
```

### Socket Event Listeners to Add
```typescript
// Power-up socket events
useEffect(() => {
  if (!socket || !powerUpsEnabled) return;

  socket.on('game:power_up_used', (data: { powerUpType: string; cooldownRemaining: number }) => {
    console.log('Power-up used:', data);
    setPowerUpUsed(true);
    setPowerUpCooldown(data.cooldownRemaining);

    // Animate power-up activation
    Animated.sequence([
      Animated.timing(powerUpAnimRef, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(powerUpAnimRef, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  });

  socket.on('game:power_up_effect', (data: { effect: ActiveEffect; questionId: string }) => {
    console.log('Power-up effect received:', data);
    if (data.questionId === currentQuestion.id) {
      setActiveEffects(prev => [...prev, data.effect]);

      // Calculate timer modifier based on effects
      const modifier = calculateTimerModifier([...activeEffects, data.effect]);
      setTimerModifier(modifier);
    }
  });

  socket.on('game:power_up_error', (data: { message: string }) => {
    Alert.alert('Power-Up Error', data.message);
  });

  return () => {
    socket.off('game:power_up_used');
    socket.off('game:power_up_effect');
    socket.off('game:power_up_error');
  };
}, [socket, powerUpsEnabled, currentQuestion, activeEffects]);
```

### Power-Up Functions to Add
```typescript
const calculateTimerModifier = (effects: ActiveEffect[]): number => {
  let isFrozen = false;
  let isBurning = false;

  effects.forEach((effect) => {
    if (effect.type === 'FREEZE') isFrozen = true;
    if (effect.type === 'BURN') isBurning = true;
  });

  // If both active, they cancel out
  if (isFrozen && isBurning) return 1.0;
  if (isFrozen) return 0; // Timer frozen
  if (isBurning) return 2.0; // Timer 2x speed

  return 1.0; // Normal
};

const usePowerUp = () => {
  if (!socket || !powerUpsEnabled || equippedPowerUp === PowerUpType.NONE) return;
  if (powerUpCooldown > 0) {
    Alert.alert('Cooldown', `Power-up is on cooldown for ${powerUpCooldown}s`);
    return;
  }

  socket.emit('game:use_power_up', {
    matchId,
    questionId: currentQuestion.id,
  });
};

// Clear effects when moving to next question
useEffect(() => {
  setActiveEffects([]);
  setTimerModifier(1.0);
}, [currentQuestionIndex]);

// Cooldown timer
useEffect(() => {
  if (powerUpCooldown > 0) {
    const interval = setInterval(() => {
      setPowerUpCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }
}, [powerUpCooldown]);
```

### UI Components to Add (Insert after timer section, before question content)
```tsx
{/* Power-Up Button (if enabled and equipped) */}
{powerUpsEnabled && equippedPowerUp !== PowerUpType.NONE && !isAsync && (
  <View style={styles.powerUpContainer}>
    <TouchableOpacity
      style={[
        styles.powerUpButton,
        powerUpCooldown > 0 && styles.powerUpButtonDisabled,
        equippedPowerUp === PowerUpType.FREEZE && { backgroundColor: '#4FC3F7' },
        equippedPowerUp === PowerUpType.BURN && { backgroundColor: '#FF6B6B' },
      ]}
      onPress={usePowerUp}
      disabled={powerUpCooldown > 0 || isPaused}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.powerUpContent,
          {
            transform: [{
              scale: powerUpAnimRef.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            }],
          },
        ]}
      >
        <Text style={styles.powerUpIcon}>
          {equippedPowerUp === PowerUpType.FREEZE ? '❄️' : '🔥'}
        </Text>
        <View style={styles.powerUpTextContainer}>
          <Text style={styles.powerUpName}>
            {equippedPowerUp === PowerUpType.FREEZE ? 'Freeze' : 'Burn'}
          </Text>
          {powerUpCooldown > 0 ? (
            <Text style={styles.powerUpCooldown}>{powerUpCooldown}s</Text>
          ) : (
            <Text style={styles.powerUpReady}>READY</Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>

    {/* Active Effects Display */}
    {activeEffects.length > 0 && (
      <View style={styles.activeEffectsContainer}>
        {activeEffects.map((effect, index) => (
          <View
            key={index}
            style={[
              styles.activeEffectBadge,
              { backgroundColor: effect.type === 'FREEZE' ? '#4FC3F7' : '#FF6B6B' },
            ]}
          >
            <Text style={styles.activeEffectText}>
              {effect.type === 'FREEZE' ? '❄️ Timer Frozen!' : '🔥 Timer Burning!'}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
)}
```

### Styles to Add
```typescript
powerUpContainer: {
  paddingHorizontal: 20,
  paddingVertical: 12,
  backgroundColor: 'white',
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
},
powerUpButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
powerUpButtonDisabled: {
  opacity: 0.5,
},
powerUpContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
powerUpIcon: {
  fontSize: 32,
  marginRight: 12,
},
powerUpTextContainer: {
  flex: 1,
},
powerUpName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: 'white',
},
powerUpCooldown: {
  fontSize: 12,
  color: 'white',
  opacity: 0.8,
},
powerUpReady: {
  fontSize: 12,
  fontWeight: 'bold',
  color: 'white',
},
activeEffectsContainer: {
  marginTop: 8,
  gap: 6,
},
activeEffectBadge: {
  padding: 8,
  borderRadius: 8,
  alignItems: 'center',
},
activeEffectText: {
  color: 'white',
  fontSize: 13,
  fontWeight: 'bold',
},
```

### Timer Logic Update
Update the timer to respect `timerModifier`:
```typescript
timerRef.current = setInterval(() => {
  setTimeRemaining((prev) => {
    if (timerModifier === 0) {
      // Timer frozen, don't decrement
      return prev;
    }

    const decrement = timerModifier; // 1 for normal, 2 for burn

    if (prev <= decrement) {
      handleTimeUp();
      return 0;
    }
    return prev - decrement;
  });
}, 1000);
```

## 📋 Navigation Integration Needed

Add PowerUpSelection screen to `RootNavigator.tsx`:
```typescript
<Stack.Screen
  name="PowerUpSelection"
  component={PowerUpSelectionScreen}
  options={{ headerShown: false }}
/>
```

Update BattleModeScreen or other match entry points to navigate to PowerUpSelection when power-ups are enabled.

## 🧪 Testing Checklist

### Backend
- [ ] Test power-up initialization in match creation
- [ ] Test freeze power-up usage (timer stops, 5s penalty)
- [ ] Test burn power-up usage (opponent timer 2x speed)
- [ ] Test freeze + burn cancellation
- [ ] Test burn + freeze cancellation
- [ ] Test 60-second cooldown
- [ ] Test power-up state persistence across questions
- [ ] Test match results include power-up usage data

### Frontend
- [ ] Test power-up selection screen navigation
- [ ] Test power-up selection UI (all 3 options)
- [ ] Test matchmaking with selected power-up
- [ ] Test power-up button appears in game (when enabled)
- [ ] Test power-up button disabled during cooldown
- [ ] Test freeze visual feedback (timer stops)
- [ ] Test burn visual feedback (timer speeds up)
- [ ] Test active effects display
- [ ] Test power-up animations
- [ ] Test socket event handling

### End-to-End
- [ ] Create match with power-ups enabled
- [ ] Both players select different power-ups
- [ ] Use freeze mid-question (timer stops)
- [ ] Use burn on opponent (their timer speeds up)
- [ ] Test freeze + burn interaction (cancellation)
- [ ] Verify cooldown works correctly
- [ ] Complete match and verify results show power-up usage
- [ ] Verify time penalties applied correctly for freeze usage

## 🎯 Power-Up Mechanics Summary

### Freeze ❄️
- **Effect**: Stops your timer for current question
- **Penalty**: +5 seconds added to total time (affects tiebreaker)
- **Cooldown**: 60 seconds
- **Counter**: Burn cancels freeze

### Burn 🔥
- **Effect**: Doubles opponent's timer speed (2x)
- **Duration**: Current question only
- **Cooldown**: 60 seconds
- **Counter**: Freeze cancels burn

### Interactions
- If player has freeze active and opponent uses burn → Freeze cancelled, timer runs normal
- If player is burning and uses freeze → Burn cancelled, timer runs normal
- Effects are question-scoped (clear when moving to next question)

## 🚀 Deployment Notes

1. Run database migration (already applied via `prisma db push`)
2. Restart backend server to load new services
3. Update mobile app with new screens and components
4. Test thoroughly in development before production release

## 📝 Future Enhancements

- [ ] Add more power-up types (shield, double points, etc.)
- [ ] Add power-up inventory system
- [ ] Add power-up unlock/progression system
- [ ] Add visual effects for power-up activation
- [ ] Add sound effects for power-ups
- [ ] Add power-up usage statistics in profile
- [ ] Add achievements for power-up usage
- [ ] Add power-up combos
