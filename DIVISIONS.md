# Division System

## Overview

The language learning app uses a division/ranking system to categorize players based on their ELO rating. Players are assigned to one of 8 divisions, each representing a different skill level.

## Division Tiers

| Division | ELO Range | Color | Emoji | Description |
|----------|-----------|-------|-------|-------------|
| **Unranked** | 0 - 799 | Gray (#808080) | ⚪ | New players or those below ranked threshold |
| **Bronze** | 800 - 1099 | Bronze (#CD7F32) | 🥉 | Beginner level players |
| **Silver** | 1100 - 1399 | Silver (#C0C0C0) | 🥈 | Intermediate level players |
| **Gold** | 1400 - 1699 | Gold (#FFD700) | 🥇 | Advanced level players |
| **Platinum** | 1700 - 1999 | Platinum (#E5E4E2) | 💎 | Expert level players |
| **Diamond** | 2000 - 2299 | Light Blue (#B9F2FF) | 💠 | Master level players |
| **Master** | 2300 - 2599 | Purple (#9B30FF) | 👑 | Elite players |
| **Grandmaster** | 2600+ | Pink (#FF1493) | 🏆 | Top players in the system |

## Division Tiers

Each division (except Unranked, Master, and Grandmaster) is further divided into 4 tiers:

- **Tier IV** (4) - Lowest tier of the division
- **Tier III** (3) - Second tier
- **Tier II** (2) - Third tier
- **Tier I** (1) - Highest tier of the division

### Tier Calculation

Within each division, tiers are calculated based on your position in the ELO range:

```typescript
divisionSpan = maxElo - minElo
tierSize = divisionSpan / 4
tier = 4 - floor((currentElo - minElo) / tierSize)
```

**Example - Gold Division (1400-1699):**
- Tier IV: 1400-1474 ELO
- Tier III: 1475-1549 ELO
- Tier II: 1550-1624 ELO
- Tier I: 1625-1699 ELO

## Division Features

### Automatic Updates

Divisions are automatically updated whenever your ELO rating changes:

- After completing a ranked match
- When ELO is manually adjusted by administrators
- During system maintenance/recalculation

### Division Progress

Players can track their progress within their current division:

```javascript
{
  "current": {
    "division": "GOLD",
    "tier": 2,
    "displayName": "Gold II"
  },
  "next": {
    "division": "PLATINUM",
    "tier": 4,
    "displayName": "Platinum IV"
  },
  "progress": 67,  // 67% through current division
  "eloToNext": 124  // 124 ELO needed to reach next division
}
```

### Division-Specific Leaderboards

View top players within each division:

```
GET /api/users/leaderboard/division/:division
```

Example: `/api/users/leaderboard/division/gold`

## API Integration

### Get User Profile with Division

```
GET /api/users/profile
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user-id",
      "username": "alice",
      "eloRating": 1550,
      "division": "GOLD",
      "divisionInfo": {
        "division": "GOLD",
        "tier": 2,
        "minElo": 1400,
        "maxElo": 1699,
        "color": "#FFD700",
        "displayName": "Gold II"
      }
    },
    "stats": {
      "totalQuizzes": 45,
      "totalMatches": 32,
      "wins": 20,
      "losses": 12,
      "winRate": 62.5
    }
  }
}
```

### Global Leaderboard

```
GET /api/users/leaderboard?limit=50
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "user-id",
        "username": "grace",
        "displayName": "Grace",
        "eloRating": 2100,
        "division": "DIAMOND",
        "rank": 1,
        "divisionInfo": {
          "division": "DIAMOND",
          "tier": 1,
          "displayName": "Diamond I",
          "color": "#B9F2FF"
        }
      }
    ]
  }
}
```

## Mobile UI Components

### DivisionBadge

Display a compact division badge:

```typescript
import { DivisionBadge } from '../components/DivisionBadge';

<DivisionBadge
  division={user.division}
  divisionInfo={user.divisionInfo}
  size="small"  // or "medium" or "large"
  showTier={true}
/>
```

### DivisionCard

Display detailed division information with progress:

```typescript
import { DivisionCard } from '../components/DivisionBadge';

<DivisionCard
  division={user.division}
  divisionInfo={user.divisionInfo}
  eloRating={user.eloRating}
/>
```

## Starting Division

New players start at **1000 ELO** which places them in **Bronze IV**.

- **Unranked** (0-799 ELO) is reserved for players who have lost significant ELO
- This ensures new players can compete immediately in ranked matches

## Promotion & Demotion

### Promotion
When your ELO exceeds the maximum for your current division:
- You are automatically promoted to the next division
- You start at Tier IV of the new division
- A notification is sent (if notifications are enabled)

### Demotion
When your ELO falls below the minimum for your current division:
- You are automatically demoted to the previous division
- You start at Tier I of the lower division
- No shame in demotions - they're part of the learning process!

## Division Distribution (Typical)

Expected player distribution across divisions:

- **Unranked**: 5%
- **Bronze**: 20%
- **Silver**: 30%
- **Gold**: 25%
- **Platinum**: 12%
- **Diamond**: 5%
- **Master**: 2%
- **Grandmaster**: 1%

## Utility Functions

### Backend (TypeScript)

```typescript
import { getDivisionFromElo, getDivisionProgress } from './utils/division';

// Get division info
const divisionInfo = getDivisionFromElo(1550);
// { division: "GOLD", tier: 2, displayName: "Gold II", ... }

// Get progress info
const progress = getDivisionProgress(1550);
// { current: {...}, next: {...}, progress: 50, eloToNext: 150 }
```

### Database Migration

If you need to recalculate divisions for all users:

```typescript
import { recalculateAllDivisions } from './services/userService';

const updated = await recalculateAllDivisions();
console.log(`Updated ${updated} users`);
```

## Best Practices

### For Players

1. **Focus on Learning**: Divisions reflect your current skill, not your potential
2. **Consistent Practice**: Regular play is more important than grinding for ELO
3. **Division Appropriate Goals**: Set realistic targets for your current division
4. **Learn from Higher Divisions**: Watch or study players in divisions above you

### For Developers

1. **Cache Division Calculations**: Division info can be calculated on-the-fly from ELO
2. **Database Indexing**: Index the division field for fast leaderboard queries
3. **Async Updates**: Division updates don't need to be synchronous with ELO changes
4. **Progress Bars**: Always show progress to next division to motivate players

## Future Enhancements

- Division-specific rewards and achievements
- Seasonal divisions with resets
- Division icons and cosmetic rewards
- Division-based matchmaking pools
- Division history tracking
- Division decay for inactive players
- Special borders/effects for top divisions
- Division-specific challenges and quests

## FAQ

**Q: Can I skip divisions?**
A: No, you must progress through each division sequentially. However, you can move through tiers quickly with strong performance.

**Q: What happens if I stop playing?**
A: Currently, divisions don't decay. Your division stays the same regardless of inactivity.

**Q: Can I see my division history?**
A: Division history tracking is planned for a future update.

**Q: Do divisions affect matchmaking?**
A: Not directly. Matchmaking is based on ELO rating, which divisions represent visually. However, similar divisions usually mean similar ELO ranges.

**Q: How often are divisions updated?**
A: Immediately after any ELO change (typically after ranked matches).

## Technical Implementation

### Files

- `backend/src/utils/division.ts` - Division calculation logic
- `backend/src/services/userService.ts` - User ELO and division updates
- `backend/prisma/schema.prisma` - Division enum and database field
- `mobile/src/components/DivisionBadge.tsx` - UI components
- `mobile/src/types/index.ts` - TypeScript types

### Database Schema

```prisma
enum Division {
  UNRANKED
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
  MASTER
  GRANDMASTER
}

model User {
  // ...
  eloRating Int      @default(1000)
  division  Division @default(BRONZE)
  // ...
}
```

## Summary

The division system provides:
- Clear visual representation of player skill
- Motivation through progression and tiers
- Community structure and competitive goals
- Easy-to-understand ranking beyond just numbers
- Division-specific leaderboards and competition

Divisions make the ELO system more engaging and accessible to all players!
