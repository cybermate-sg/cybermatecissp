import { Page } from '@playwright/test';

/**
 * Database cleanup utilities for E2E tests
 */
export class DatabaseCleanup {
  constructor(private page: Page) {}

  /**
   * Delete all classes (and their associated decks/flashcards via cascade)
   * This ensures test isolation between runs
   */
  async deleteAllClasses(): Promise<void> {
    try {
      // Fetch all classes
      const response = await this.page.request.get('/api/admin/classes');

      if (!response.ok()) {
        console.warn('Failed to fetch classes for cleanup');
        return;
      }

      const data = await response.json();
      const classes = data.classes || [];

      // Delete each class
      for (const cls of classes) {
        try {
          await this.page.request.delete(`/api/admin/classes/${cls.id}`);
        } catch (error) {
          console.warn(`Failed to delete class ${cls.id}:`, error);
        }
      }

      console.log(`✓ Cleaned up ${classes.length} classes`);
    } catch (error) {
      console.error('Error during database cleanup:', error);
      // Don't throw - we want tests to continue even if cleanup fails
    }
  }

  /**
   * Delete a specific class by name
   */
  async deleteClassByName(className: string): Promise<boolean> {
    try {
      const response = await this.page.request.get('/api/admin/classes');

      if (!response.ok()) {
        return false;
      }

      const data = await response.json();
      const classes = data.classes || [];
      const classToDelete = classes.find((c: any) => c.name === className);

      if (classToDelete) {
        await this.page.request.delete(`/api/admin/classes/${classToDelete.id}`);
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`Failed to delete class "${className}":`, error);
      return false;
    }
  }
}
