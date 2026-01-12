import prisma from '../utils/db';
import { PowerUpType } from '@prisma/client';

export interface PowerUpState {
  equipped: PowerUpType;
  lastUsed: string | null;
  cooldownEndsAt: string | null;
  activeEffects: ActiveEffect[];
}

export interface ActiveEffect {
  type: 'FREEZE' | 'BURN';
  source: string; // userId who applied the effect
  target: string; // userId affected
  questionId: string;
  appliedAt: string;
  expiresAt: string | null; // null means it lasts until question ends
}

export interface PowerUpUsage {
  questionId: string;
  powerUpType: PowerUpType;
  timestamp: string;
  target: 'self' | 'opponent';
}

class PowerUpService {
  // Power-up cooldown duration in milliseconds (e.g., 60 seconds)
  private readonly COOLDOWN_DURATION_MS = 60000; // 60 seconds

  // Time penalty for using freeze (5 seconds added to total time)
  private readonly FREEZE_TIME_PENALTY_MS = 5000; // 5 seconds

  /**
   * Initialize power-up state for a match
   */
  initializePowerUpState(userIds: string[], equippedPowerUps: Map<string, PowerUpType>): Record<string, PowerUpState> {
    const state: Record<string, PowerUpState> = {};

    userIds.forEach((userId) => {
      state[userId] = {
        equipped: equippedPowerUps.get(userId) || PowerUpType.NONE,
        lastUsed: null,
        cooldownEndsAt: null,
        activeEffects: [],
      };
    });

    return state;
  }

  /**
   * Check if a power-up can be used (not on cooldown)
   */
  canUsePowerUp(playerState: PowerUpState): boolean {
    if (playerState.equipped === PowerUpType.NONE) {
      return false;
    }

    if (!playerState.cooldownEndsAt) {
      return true;
    }

    const now = new Date();
    const cooldownEnds = new Date(playerState.cooldownEndsAt);

    return now >= cooldownEnds;
  }

  /**
   * Use a power-up and update state
   */
  async usePowerUp(
    matchId: string,
    userId: string,
    opponentId: string,
    questionId: string,
    powerUpState: Record<string, PowerUpState>
  ): Promise<{
    success: boolean;
    message?: string;
    updatedState?: Record<string, PowerUpState>;
    effect?: ActiveEffect;
  }> {
    const playerState = powerUpState[userId];

    // Validate power-up can be used
    if (!this.canUsePowerUp(playerState)) {
      return {
        success: false,
        message: 'Power-up is on cooldown',
      };
    }

    const now = new Date();
    const powerUpType = playerState.equipped;

    // Create new effect
    const effect: ActiveEffect = {
      type: powerUpType as 'FREEZE' | 'BURN',
      source: userId,
      target: powerUpType === PowerUpType.FREEZE ? userId : opponentId,
      questionId,
      appliedAt: now.toISOString(),
      expiresAt: null, // Lasts until question ends
    };

    // Handle power-up interactions
    const updatedState = this.handlePowerUpInteractions(powerUpState, effect);

    // Update player's cooldown
    updatedState[userId].lastUsed = now.toISOString();
    updatedState[userId].cooldownEndsAt = new Date(now.getTime() + this.COOLDOWN_DURATION_MS).toISOString();

    // Save state to database
    await prisma.match.update({
      where: { id: matchId },
      data: {
        powerUpState: updatedState as any,
      },
    });

    return {
      success: true,
      updatedState,
      effect,
    };
  }

  /**
   * Handle power-up interactions (freeze vs burn)
   */
  private handlePowerUpInteractions(
    powerUpState: Record<string, PowerUpState>,
    newEffect: ActiveEffect
  ): Record<string, PowerUpState> {
    const updatedState = JSON.parse(JSON.stringify(powerUpState)); // Deep clone

    const targetState = updatedState[newEffect.target];
    const targetEffects = targetState.activeEffects;

    // Check for existing effects on the same target for this question
    const existingEffectIndex = targetEffects.findIndex(
      (e: ActiveEffect) => e.questionId === newEffect.questionId
    );

    if (existingEffectIndex !== -1) {
      const existingEffect = targetEffects[existingEffectIndex];

      // Interaction logic:
      // 1. FREEZE + BURN (opponent burns frozen player) = Cancel freeze, timer runs normal
      // 2. BURN + FREEZE (burning player freezes) = Cancel burn effect
      if (
        (existingEffect.type === 'FREEZE' && newEffect.type === 'BURN') ||
        (existingEffect.type === 'BURN' && newEffect.type === 'FREEZE')
      ) {
        // Remove existing effect (they cancel out)
        targetEffects.splice(existingEffectIndex, 1);
        console.log(`Power-up interaction: ${existingEffect.type} cancelled by ${newEffect.type}`);
        return updatedState;
      }
    }

    // No interaction, add new effect
    targetEffects.push(newEffect);

    return updatedState;
  }

  /**
   * Get active effects for a specific player and question
   */
  getActiveEffects(
    powerUpState: Record<string, PowerUpState>,
    userId: string,
    questionId: string
  ): ActiveEffect[] {
    const playerState = powerUpState[userId];
    if (!playerState) return [];

    return playerState.activeEffects.filter((e: ActiveEffect) => e.questionId === questionId);
  }

  /**
   * Calculate timer modifier based on active effects
   * Returns multiplier for timer speed (1.0 = normal, 0 = frozen, 2.0 = double speed)
   */
  getTimerModifier(effects: ActiveEffect[]): number {
    let isFrozen = false;
    let isBurning = false;

    effects.forEach((effect) => {
      if (effect.type === 'FREEZE') {
        isFrozen = true;
      } else if (effect.type === 'BURN') {
        isBurning = true;
      }
    });

    // If both freeze and burn are active, they should have cancelled out
    // But just in case, prioritize normal speed
    if (isFrozen && isBurning) {
      return 1.0; // Normal speed
    }

    if (isFrozen) {
      return 0; // Timer frozen
    }

    if (isBurning) {
      return 2.0; // Timer runs 2x faster
    }

    return 1.0; // Normal speed
  }

  /**
   * Clear effects for a specific question (when question ends)
   */
  async clearQuestionEffects(
    matchId: string,
    questionId: string,
    powerUpState: Record<string, PowerUpState>
  ): Promise<Record<string, PowerUpState>> {
    const updatedState = JSON.parse(JSON.stringify(powerUpState)); // Deep clone

    // Remove effects for this question from all players
    Object.keys(updatedState).forEach((userId) => {
      updatedState[userId].activeEffects = updatedState[userId].activeEffects.filter(
        (e: ActiveEffect) => e.questionId !== questionId
      );
    });

    // Save updated state
    await prisma.match.update({
      where: { id: matchId },
      data: {
        powerUpState: updatedState as any,
      },
    });

    return updatedState;
  }

  /**
   * Record power-up usage in match result
   */
  async recordPowerUpUsage(
    matchId: string,
    userId: string,
    powerUpType: PowerUpType,
    questionId: string,
    target: 'self' | 'opponent'
  ): Promise<void> {
    const matchResult = await prisma.matchResult.findUnique({
      where: {
        matchId_userId: {
          matchId,
          userId,
        },
      },
    });

    if (!matchResult) {
      // Create match result if it doesn't exist yet
      await prisma.matchResult.create({
        data: {
          matchId,
          userId,
          score: 0,
          correctAnswers: 0,
          totalTimeMs: 0,
          answers: {},
          equippedPowerUp: powerUpType,
          powerUpUsages: [
            {
              questionId,
              powerUpType,
              timestamp: new Date().toISOString(),
              target,
            },
          ],
        },
      });
      return;
    }

    const existingUsages = (matchResult.powerUpUsages as unknown as PowerUpUsage[]) || [];
    const newUsage: PowerUpUsage = {
      questionId,
      powerUpType,
      timestamp: new Date().toISOString(),
      target,
    };

    await prisma.matchResult.update({
      where: {
        matchId_userId: {
          matchId,
          userId,
        },
      },
      data: {
        powerUpUsages: [...existingUsages, newUsage] as any,
      },
    });
  }

  /**
   * Calculate time penalty for freeze usage
   */
  calculateTimePenalty(powerUpUsages: PowerUpUsage[]): number {
    const freezeUsages = powerUpUsages.filter((usage) => usage.powerUpType === PowerUpType.FREEZE);
    return freezeUsages.length * this.FREEZE_TIME_PENALTY_MS;
  }

  /**
   * Get power-up cooldown remaining in seconds
   */
  getCooldownRemaining(playerState: PowerUpState): number {
    if (!playerState.cooldownEndsAt) {
      return 0;
    }

    const now = new Date();
    const cooldownEnds = new Date(playerState.cooldownEndsAt);
    const remainingMs = cooldownEnds.getTime() - now.getTime();

    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
}

export const powerUpService = new PowerUpService();
