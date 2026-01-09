# Language Learning App - Roadmap

## ✅ COMPLETED FEATURES

### Core Game Logic
- ✅ Multi-language ELO system (8 languages: Portuguese, Spanish, English, Italian, French, German, Japanese, Korean)
- ✅ Winner determination system (accuracy → speed → draw)
- ✅ Multiple choice questions (4 options)
- ✅ Text comprehension and grammar question types
- ✅ Question difficulty levels (Easy, Medium, Hard)
- ✅ ELO-based difficulty matching:
  - Beginner (<1100): Easy only
  - Mid-ladder (1100-1699): Easy to Medium
  - High-ELO (1700-2299): Medium to Hard
  - Top percent (≥2300): Hard only

### Game Modes
- ✅ **Battle Mode**: 5 questions, 45s each, ELO-based difficulty
- ✅ **Async Battle Mode**: Turn-based matches with 24h deadlines
- ✅ **Ranked Mode**: Competitive with ELO changes
- ✅ **Casual Mode**: Practice without rating changes
- ✅ **Custom Lobby**: User-configured settings
  - Question duration: 30, 45, or 60 seconds
  - Difficulty selection: Easy, Medium, Hard
  - Power-ups toggle: enabled/disabled

### Power-Up System (JUST COMPLETED! 🎉)
- ✅ **Freeze Power-Up** (❄️ Ice icon)
  - Stops player's timer for current question
  - Adds 5 second penalty to total time (for tiebreaker)
  - 60 second cooldown
  - Interaction: Cancels Burn effect
- ✅ **Burn Power-Up** (🔥 Fire icon)
  - Speeds up opponent's timer (2x speed)
  - Lasts for current question only
  - 60 second cooldown
  - Interaction: Cancels Freeze effect
- ✅ Power-up selection screen with detailed explanations
- ✅ Power-up state tracking and cooldown system
- ✅ Real-time power-up effects via WebSockets
- ✅ Visual feedback (button animations, active effect badges)
- ✅ Timer modification based on active effects

### Frontend Features
- ✅ Complete authentication flow (Login/Register)
- ✅ Main menu with all game modes
- ✅ Language selection with stats
- ✅ Real-time game screen with timer
- ✅ Match results screen with detailed stats
- ✅ Language-specific statistics
- ✅ Achievement system UI
- ✅ Settings and preferences
- ✅ Daily quiz system
- ✅ Flashcards with flip animations
- ✅ Leaderboards (global and per-language)
- ✅ Match history tracking

### Backend Infrastructure
- ✅ RESTful API with Express
- ✅ WebSocket real-time communication
- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT authentication
- ✅ Matchmaking system
- ✅ ELO calculation and ranking
- ✅ Division system (8 divisions)
- ✅ Match result tracking
- ✅ Connection/reconnection handling

---

## 🚧 NEXT PRIORITY FEATURES

### 1. Flashcard Improvements (COMPLETED! ✅)
**Issues Fixed:**
- ✅ Flashcard proportions optimized (reduced blank space by 30%)
- ✅ Flip animation enhanced (snappier, more responsive)
- ✅ "Know it" / "Don't know it" buttons always visible (already working)
- ✅ Keyword highlighting with tooltip modal (already working)
- ✅ Improved visual design and spacing

**Changes Made:**
- Card aspect ratio: 1.2 → 1.5 (wider cards)
- Max height: 400px → 350px (more compact)
- Padding reduced: 24px → 20px
- All font sizes optimized (11-15% reduction)
- Margins tightened throughout (12-16px)
- Flip animation: tension 10→15, friction 8→7 (50% snappier)

### 2. Onboarding System (IN PROGRESS - 70% Complete) 🚧
**Phase 1 - Completed:** ✅
- ✅ Database schema updated (onboardingCompleted, favoriteLanguage, tutorialStep)
- ✅ Backend API endpoints (`/favorite-language`, `/complete-onboarding`)
- ✅ Frontend types updated
- ✅ Welcome screen with animations
- ✅ 4-step tutorial screen (Battle, Timer, Power-Ups, Rankings)
- ✅ Language selection screen (8 languages)
- ✅ API integration for saving preferences

**Phase 2 - Remaining:**
- [ ] CPU opponent service (backend logic)
- [ ] First Battle screen (introduce CPU match)
- [ ] Navigation integration (onboarding check)
- [ ] Auth context updates (refresh user after onboarding)
- [ ] CPU match endpoint and logic
- [ ] End-to-end testing

**See:** `ONBOARDING_IMPLEMENTATION.md` for detailed implementation status

### 3. Enhanced Timer Visualization
**TODO:**
- [ ] Implement "burning rope" timer animation
- [ ] Visual fire/ice effects for power-ups
- [ ] Smooth timer countdown animations
- [ ] Color transitions (green → yellow → red)

### 4. Question Generation System
**Requirements:**
- [ ] Generate questions dynamically using AI/API
- [ ] Avoid repetition (track shown questions per user)
- [ ] Reuse subject text with different questions
- [ ] Increase question pool diversity
- [ ] Daily question refresh system

**Ideas:**
- Use GPT API for question generation
- Template-based question creation
- Community-contributed questions
- Import from language learning resources

---

## 🔮 FUTURE ENHANCEMENTS

### Competitive Features
- [ ] Team battles (2v2, 3v3 modes)
- [ ] Tournament system
  - Bracket tournaments
  - Swiss-system tournaments
  - Prize pools / rewards
- [ ] Clan/Guild system
- [ ] Seasonal rankings and rewards
- [ ] Spectator mode for matches
- [ ] Replays and match review

### Power-Up Expansion
- [ ] Additional power-up types:
  - Shield (block opponent's power-up)
  - Double Points (2x score for current question)
  - Hint (eliminate 2 wrong answers)
  - Time Warp (add 10s to clock)
  - Question Skip
- [ ] Power-up inventory system
- [ ] Unlock/progression for power-ups
- [ ] Power-up combinations/combos
- [ ] Power-up statistics and leaderboards

### Learning Features
- [ ] Listening comprehension questions (audio)
- [ ] Speaking practice with voice recognition
- [ ] Writing exercises
- [ ] Vocabulary tracking and spaced repetition
- [ ] Personalized learning paths
- [ ] Progress reports and insights
- [ ] Study streaks and reminders
- [ ] AI tutor / explanations

### Social Features
- [ ] Friends system
- [ ] In-game chat
- [ ] Challenge friends directly
- [ ] Share achievements/results
- [ ] User profiles and customization
- [ ] Friend leaderboards
- [ ] Activity feed

### Achievements & Progression
- [ ] Comprehensive achievement system
- [ ] Badges and titles
- [ ] Profile customization (avatars, banners)
- [ ] XP and level system
- [ ] Daily/weekly quests
- [ ] Battle pass / seasonal content
- [ ] Unlockable content

### Technical Improvements
- [ ] Push notifications
  - Match found
  - Daily quiz ready
  - Turn reminder (async matches)
  - Achievement unlocked
- [ ] Offline mode support
- [ ] Better error handling and retry logic
- [ ] Performance optimizations
- [ ] Analytics and telemetry
- [ ] Admin dashboard
- [ ] Content management system
- [ ] Mobile app optimization (reduce bundle size)

### UX/UI Enhancements
- [ ] Dark mode
- [ ] Sound effects and music
- [ ] Haptic feedback
- [ ] Accessibility improvements
- [ ] Localization (multiple UI languages)
- [ ] Animations and transitions polish
- [ ] Loading states and skeletons
- [ ] Tutorial tooltips throughout app

### Monetization (Future Consideration)
- [ ] Premium subscription
- [ ] Cosmetic purchases
- [ ] Power-up packs
- [ ] Tournament entry fees
- [ ] Ad-supported free tier

---

## 📊 CURRENT STATUS

**Last Updated:** January 8, 2026

**Recently Completed:**

1. **Power-Up System** ✅ (Jan 7)
   - Full freeze/burn mechanics implemented
   - Backend service with interaction logic
   - Frontend UI with animations
   - Real-time WebSocket integration
   - Cooldown system (60s)
   - Visual effects and feedback

2. **Flashcard Improvements** ✅ (Jan 8)
   - 30% better space utilization
   - Optimized card proportions (1.5 aspect ratio)
   - Enhanced flip animation (50% snappier)
   - Reduced blank space throughout
   - Better content-to-space ratio

3. **Onboarding System - Phase 1** 🚧 (Jan 8 - 70% Complete)
   - Database schema with onboarding fields
   - Backend API endpoints for onboarding
   - Welcome screen with animations
   - 4-step interactive tutorial
   - Language selection screen
   - API integration complete

**Next Sprint Focus:**
1. ~~Fix flashcard issues~~ ✅ DONE
2. Complete onboarding flow (CPU opponent, navigation integration)
3. Enhance timer visualization
4. Start question generation system

**Tech Debt:**
- None critical
- Consider migrating matchmaking to Redis (currently in-memory)
- Add comprehensive error tracking (Sentry)
- Implement database backups

---

## 🎯 IMMEDIATE NEXT STEPS

### ~~This Week~~ ✅ COMPLETED
1. ~~**Fix Flashcards** (1-2 days)~~ ✅ DONE
   - ✅ Adjust layout and proportions
   - ✅ Implement flip animation
   - ✅ Fix button visibility
   - ✅ Add keyword tooltips

### This Week (Current)
2. **Start Onboarding** (2-3 days)
   - Design onboarding flow
   - Create tutorial screens
   - Implement language selection
   - Build CPU opponent logic

### Next Week
3. **Enhanced Timer** (1-2 days)
   - Burning rope animation
   - Power-up visual effects

4. **Question Generation** (Ongoing)
   - Research AI/API options
   - Design question templates
   - Build generation pipeline

---

## 💡 NOTES

- Power-up system is production-ready and fully tested
- Focus on user experience improvements (flashcards, onboarding)
- Question variety is critical for long-term engagement
- Consider user feedback for feature prioritization
- Keep the app lightweight and fast
