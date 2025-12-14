import { db } from '@/lib/db';
import {
  adminAiQuotaConfig,
  adminAiDailyUsage,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface QuotaStatus {
  isQuotaExceeded: boolean;
  generationsUsedToday: number;
  remainingGenerations: number;
  quotaLimit: number;
  resetTime: Date;
  isEnabled: boolean;
}

export interface QuotaConfig {
  dailyQuotaLimit: number;
  flashcardQuestionsDefault: number;
  deckQuestionsDefault: number;
  quotaResetHour: number;
  isEnabled: boolean;
  notes?: string;
}

export class AiQuotaManager {
  /**
   * Checks if admin has available quota for AI generation
   */
  async checkQuota(adminId: string): Promise<QuotaStatus> {
    // Get or create admin quota configuration
    const config = await this.getOrCreateConfig(adminId);

    if (!config.isEnabled) {
      return {
        isQuotaExceeded: true,
        generationsUsedToday: 0,
        remainingGenerations: 0,
        quotaLimit: config.dailyQuotaLimit,
        resetTime: this.calculateResetTime(config.quotaResetHour),
        isEnabled: false,
      };
    }

    // Get today's usage
    const today = this.getTodayDateString();
    const usage = await this.getTodayUsage(adminId, today);

    // Check if we need to reset (new day)
    if (this.shouldReset(usage?.lastResetAt, config.quotaResetHour)) {
      await this.resetDailyUsage(adminId, today, config.dailyQuotaLimit);
      // Return fresh quota
      return {
        isQuotaExceeded: false,
        generationsUsedToday: 0,
        remainingGenerations: config.dailyQuotaLimit,
        quotaLimit: config.dailyQuotaLimit,
        resetTime: this.calculateResetTime(config.quotaResetHour),
        isEnabled: true,
      };
    }

    const usedToday = usage?.generationsUsed || 0;
    const remaining = Math.max(0, config.dailyQuotaLimit - usedToday);

    return {
      isQuotaExceeded: usedToday >= config.dailyQuotaLimit,
      generationsUsedToday: usedToday,
      remainingGenerations: remaining,
      quotaLimit: config.dailyQuotaLimit,
      resetTime: this.calculateResetTime(config.quotaResetHour),
      isEnabled: true,
    };
  }

  /**
   * Increments the admin's daily usage counter
   */
  async incrementUsage(adminId: string): Promise<void> {
    const today = this.getTodayDateString();
    const config = await this.getOrCreateConfig(adminId);

    // Check if usage record exists for today
    const existing = await this.getTodayUsage(adminId, today);

    if (existing) {
      // Increment existing usage
      await db
        .update(adminAiDailyUsage)
        .set({
          generationsUsed: existing.generationsUsed + 1,
          updatedAt: new Date(),
        })
        .where(eq(adminAiDailyUsage.id, existing.id));
    } else {
      // Create new usage record for today
      await db.insert(adminAiDailyUsage).values({
        adminId,
        usageDate: today,
        generationsUsed: 1,
        quotaLimit: config.dailyQuotaLimit,
        lastResetAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Gets or creates the admin's quota configuration
   */
  async getOrCreateConfig(adminId: string): Promise<QuotaConfig> {
    const [existing] = await db
      .select()
      .from(adminAiQuotaConfig)
      .where(eq(adminAiQuotaConfig.adminId, adminId))
      .limit(1);

    if (existing) {
      return {
        dailyQuotaLimit: existing.dailyQuotaLimit,
        flashcardQuestionsDefault: existing.flashcardQuestionsDefault,
        deckQuestionsDefault: existing.deckQuestionsDefault,
        quotaResetHour: existing.quotaResetHour,
        isEnabled: existing.isEnabled,
        notes: existing.notes || undefined,
      };
    }

    // Create default configuration
    const [newConfig] = await db
      .insert(adminAiQuotaConfig)
      .values({
        adminId,
        dailyQuotaLimit: 50,
        flashcardQuestionsDefault: 5,
        deckQuestionsDefault: 50,
        quotaResetHour: 0, // Midnight UTC
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      dailyQuotaLimit: newConfig.dailyQuotaLimit,
      flashcardQuestionsDefault: newConfig.flashcardQuestionsDefault,
      deckQuestionsDefault: newConfig.deckQuestionsDefault,
      quotaResetHour: newConfig.quotaResetHour,
      isEnabled: newConfig.isEnabled,
      notes: newConfig.notes || undefined,
    };
  }

  /**
   * Updates the admin's quota configuration
   */
  async updateConfig(
    adminId: string,
    updates: Partial<QuotaConfig>
  ): Promise<void> {
    // Ensure config exists
    await this.getOrCreateConfig(adminId);

    // Update the configuration
    await db
      .update(adminAiQuotaConfig)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(adminAiQuotaConfig.adminId, adminId));
  }

  /**
   * Gets today's usage record for the admin
   */
  private async getTodayUsage(adminId: string, todayDate: string) {
    const [usage] = await db
      .select()
      .from(adminAiDailyUsage)
      .where(
        and(
          eq(adminAiDailyUsage.adminId, adminId),
          eq(adminAiDailyUsage.usageDate, todayDate)
        )
      )
      .limit(1);
    return usage;
  }

  /**
   * Resets the daily usage counter
   */
  private async resetDailyUsage(
    adminId: string,
    todayDate: string,
    quotaLimit: number
  ): Promise<void> {
    const existing = await this.getTodayUsage(adminId, todayDate);

    if (existing) {
      // Reset existing record
      await db
        .update(adminAiDailyUsage)
        .set({
          generationsUsed: 0,
          quotaLimit,
          lastResetAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(adminAiDailyUsage.id, existing.id));
    } else {
      // Create new record for today
      await db.insert(adminAiDailyUsage).values({
        adminId,
        usageDate: todayDate,
        generationsUsed: 0,
        quotaLimit,
        lastResetAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Determines if the quota should be reset based on the last reset time
   */
  private shouldReset(lastResetAt: Date | null, resetHour: number): boolean {
    if (!lastResetAt) return true;

    const now = new Date();
    const lastReset = new Date(lastResetAt);

    // Calculate the most recent reset time
    const todayResetTime = new Date(now);
    todayResetTime.setUTCHours(resetHour, 0, 0, 0);

    // If current time is past today's reset time and last reset was before it, reset
    if (now >= todayResetTime && lastReset < todayResetTime) {
      return true;
    }

    // If last reset was yesterday or earlier, reset
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceReset >= 1;
  }

  /**
   * Calculates the next quota reset time
   */
  private calculateResetTime(resetHour: number): Date {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setUTCHours(resetHour, 0, 0, 0);

    // If reset time has already passed today, set it for tomorrow
    if (now >= resetTime) {
      resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    }

    return resetTime;
  }

  /**
   * Gets today's date as a string in YYYY-MM-DD format
   */
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Gets the default question count for a generation type
   */
  async getDefaultQuestionCount(
    adminId: string,
    generationType: 'flashcard' | 'deck'
  ): Promise<number> {
    const config = await this.getOrCreateConfig(adminId);
    return generationType === 'flashcard'
      ? config.flashcardQuestionsDefault
      : config.deckQuestionsDefault;
  }
}

/**
 * Factory function to create a quota manager instance
 */
export function createQuotaManager(): AiQuotaManager {
  return new AiQuotaManager();
}
