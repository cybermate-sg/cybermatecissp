import { Page } from '@playwright/test';

export interface ClassFormData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  isPublished?: boolean;
}

/**
 * Helper class for Class CRUD operations in tests
 */
export class ClassTestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to admin classes page
   */
  async navigateToClassesPage() {
    await this.page.goto('/admin/classes');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for page to be loaded by ensuring loading spinner is gone
   */
  async waitForPageLoad() {
    // First ensure the "New Class" button is visible
    await this.page.waitForSelector('button:has-text("New Class")', {
      timeout: 10000,
    });
    // Wait for any loading spinners to disappear
    try {
      await this.page.waitForSelector('.animate-spin', {
        state: 'hidden',
        timeout: 10000,
      });
    } catch {
      // No loading spinner present, which is fine
    }
  }

  /**
   * Click the "New Class" button to open create dialog
   */
  async clickNewClass() {
    await this.page.click('button:has-text("New Class")');
    await this.page.waitForSelector('div[role="dialog"]');
  }

  /**
   * Fill the class form with provided data
   */
  async fillClassForm(data: ClassFormData) {
    // Fill name
    await this.page.fill('input#name', data.name);

    // Fill description if provided
    if (data.description !== undefined) {
      await this.page.fill('textarea#description', data.description);
    }

    // Select icon if provided
    if (data.icon) {
      // Find the Icon select (first combobox)
      const iconSelect = this.page.locator('button[role="combobox"]').first();
      await iconSelect.click();

      // Click the option with the icon value and label (e.g., "📚 Books")
      await this.page.click(`text="${data.icon}"`);

      // Wait for dropdown overlay to disappear before proceeding
      await this.page.waitForSelector('[data-state="open"][aria-hidden="true"]', {
        state: 'hidden',
        timeout: 5000,
      }).catch(() => {
        // Overlay might not exist, which is fine
      });
    }

    // Select color if provided
    if (data.color) {
      // Find the Color Theme select (second combobox)
      const colorSelect = this.page.locator('button[role="combobox"]').nth(1);
      await colorSelect.click();

      // Click the color option by its label
      await this.page.click(`text="${data.color}"`);
    }

    // Set order if provided
    if (data.order !== undefined) {
      await this.page.fill('input#order', data.order.toString());
    }

    // Toggle published status if provided
    if (data.isPublished !== undefined) {
      const switchButton = this.page.locator('button[role="switch"]');
      const isCurrentlyChecked = await switchButton.getAttribute('data-state');
      const shouldBeChecked = data.isPublished;

      if (
        (isCurrentlyChecked === 'checked' && !shouldBeChecked) ||
        (isCurrentlyChecked === 'unchecked' && shouldBeChecked)
      ) {
        await switchButton.click();
      }
    }
  }

  /**
   * Submit the class form (create or update)
   * @param action - The action button text ('Create' or 'Update')
   * @param waitForClose - Whether to wait for dialog to close (set to false for validation errors)
   */
  async submitForm(
    action: 'Create' | 'Update' = 'Create',
    waitForClose: boolean = true
  ) {
    // Click the submit button
    await this.page.click(`button:has-text("${action} Class")`);

    if (waitForClose) {
      try {
        // Wait for dialog to close with a reasonable timeout
        await this.page.waitForSelector('div[role="dialog"]', {
          state: 'hidden',
          timeout: 15000, // Increased timeout for API calls
        });
        // Wait a moment for the page to update
        await this.page.waitForTimeout(500);
      } catch (error) {
        // If dialog didn't close, check if there's an error message
        const dialogStillOpen = await this.page.locator('div[role="dialog"]').isVisible();
        if (dialogStillOpen) {
          // Capture the current state for debugging
          const buttonText = await this.page.locator('div[role="dialog"] button').allTextContents();
          throw new Error(
            `Dialog did not close after clicking "${action} Class". ` +
            `Dialog is still open. Buttons visible: ${buttonText.join(', ')}. ` +
            `This may indicate an API error or timeout.`
          );
        }
        throw error;
      }
    } else {
      // For validation errors, just wait a bit for the error to appear
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Cancel the form
   */
  async cancelForm() {
    await this.page.click('button:has-text("Cancel")');
    await this.page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
  }

  /**
   * Click edit button for a class by name
   */
  async clickEditClass(className: string) {
    // Wait for page to be stable before looking for the element
    await this.page.waitForLoadState('domcontentloaded');

    // Find the class card by name using getByRole to handle special characters
    const classCard = this.page.getByRole('heading', { level: 3, name: className, exact: true }).first();
    await classCard.waitFor({ state: 'visible', timeout: 10000 });

    // Ensure the element is attached to the DOM
    await classCard.waitFor({ state: 'attached', timeout: 5000 });

    // Navigate up to the main card container (4 levels up from h3)
    const cardContainer = classCard
      .locator('..') // div.flex.items-center.gap-2.mb-1
      .locator('..') // div.flex-1
      .locator('..') // div.flex.items-start.gap-3.flex-1
      .locator('..'); // div.flex.items-start.justify-between

    // Find the edit button (has Edit2 icon, ghost variant)
    const editButton = cardContainer
      .locator('button')
      .filter({ has: this.page.locator('svg') })
      .nth(1);
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();
    await this.page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
  }

  /**
   * Click delete button for a class by name
   */
  async clickDeleteClass(className: string) {
    // Wait for page to be stable before looking for the element
    await this.page.waitForLoadState('domcontentloaded');

    const classCard = this.page.getByRole('heading', { level: 3, name: className, exact: true }).first();
    await classCard.waitFor({ state: 'visible', timeout: 10000 });

    // Ensure the element is attached to the DOM
    await classCard.waitFor({ state: 'attached', timeout: 5000 });

    // Navigate up to the main card container (4 levels up from h3)
    const cardContainer = classCard
      .locator('..') // div.flex.items-center.gap-2.mb-1
      .locator('..') // div.flex-1
      .locator('..') // div.flex.items-start.gap-3.flex-1
      .locator('..'); // div.flex.items-start.justify-between

    // Find delete button (has red text color)
    const deleteButton = cardContainer.locator('button.text-red-400');
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
    await deleteButton.click();

    // Wait for delete confirmation dialog
    await this.page.waitForSelector('text="Delete Class"', { timeout: 10000 });
  }

  /**
   * Confirm deletion in the delete dialog
   */
  async confirmDelete() {
    await this.page.click('button:has-text("Delete Class")');
    await this.page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
  }

  /**
   * Cancel deletion in the delete dialog
   */
  async cancelDelete() {
    await this.page.click('button:has-text("Cancel")');
    await this.page.waitForSelector('div[role="dialog"]', { state: 'hidden' });
  }

  /**
   * Check if a class exists on the page
   */
  async classExists(className: string): Promise<boolean> {
    try {
      // Use getByText with exact match to handle special characters properly
      const classCard = this.page.getByRole('heading', { level: 3, name: className, exact: true }).first();
      await classCard.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the total classes count from stats
   */
  async getTotalClassesCount(): Promise<number> {
    const text = await this.page
      .locator('text="Total Classes"')
      .locator('..')
      .locator('..')
      .locator('div.text-3xl')
      .textContent();
    return parseInt(text?.trim() || '0');
  }

  /**
   * Get the published classes count from stats
   */
  async getPublishedClassesCount(): Promise<number> {
    const text = await this.page
      .locator('text="Published Classes"')
      .locator('..')
      .locator('..')
      .locator('div.text-3xl')
      .textContent();
    return parseInt(text?.trim() || '0');
  }

  /**
   * Wait for toast message and ensure page updates complete
   */
  async waitForToast(message: string) {
    try {
      // Check if page is still alive before waiting
      if (this.page.isClosed()) {
        throw new Error('Page was closed before waiting for toast');
      }

      // Wait for toast to appear
      await this.page.waitForSelector(`text="${message}"`, { timeout: 10000 });

      // Wait for toast to disappear (indicates operation completed)
      await this.page.waitForSelector(`text="${message}"`, {
        state: 'hidden',
        timeout: 10000
      }).catch(() => {
        // Toast might auto-dismiss, which is fine
      });

      // Check page is still alive before waiting for network
      if (!this.page.isClosed()) {
        // Wait for any pending network requests to complete
        // Use a shorter timeout and catch errors since the page might already be idle
        await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {
          // Network might already be idle
        });

        // Small delay to allow React state updates to propagate
        await this.page.waitForTimeout(500);
      }
    } catch (error) {
      // Provide more context if the error is due to page closure
      if (this.page.isClosed()) {
        throw new Error(
          `Page was closed while waiting for toast message: "${message}". ` +
          `This may indicate a navigation or browser crash.`
        );
      }
      throw error;
    }
  }

  /**
   * Check if a class has the "Draft" badge
   */
  async isDraft(className: string): Promise<boolean> {
    const classCard = this.page.getByRole('heading', { level: 3, name: className, exact: true }).first();
    const container = classCard.locator('..');
    const draftBadge = container.locator('text="Draft"');
    try {
      await draftBadge.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get class details from the page
   */
  async getClassDetails(className: string): Promise<{
    name: string;
    description?: string;
    isDraft: boolean;
  }> {
    const classCard = this.page.getByRole('heading', { level: 3, name: className, exact: true }).first();
    await classCard.waitFor({ state: 'visible' });

    // Navigate up to the flex-1 container that holds both title and description
    const contentContainer = classCard.locator('..').locator('..');
    const nameElement = await classCard.textContent();
    const descriptionElement = await contentContainer
      .locator('p')
      .first()
      .textContent();
    const isDraft = await this.isDraft(className);

    return {
      name: nameElement?.trim() || '',
      description: descriptionElement?.trim() || undefined,
      isDraft,
    };
  }

  /**
   * Click "Manage Decks" button for a class
   */
  async clickManageDecks(className: string) {
    // Wait for page to be stable before looking for the element
    await this.page.waitForLoadState('domcontentloaded');

    const classCard = this.page.getByRole('heading', { level: 3, name: className, exact: true }).first();
    await classCard.waitFor({ state: 'visible', timeout: 10000 });

    // Ensure the element is attached to the DOM
    await classCard.waitFor({ state: 'attached', timeout: 5000 });

    // Navigate up to the main card container (4 levels up from h3)
    const cardContainer = classCard
      .locator('..') // div.flex.items-center.gap-2.mb-1
      .locator('..') // div.flex-1
      .locator('..') // div.flex.items-start.gap-3.flex-1
      .locator('..'); // div.flex.items-start.justify-between

    // Find the Link element that wraps the "Manage Decks" button
    const manageDecksLink = cardContainer.locator('a:has(button:has-text("Manage Decks"))');
    await manageDecksLink.waitFor({ state: 'visible', timeout: 5000 });

    // Get the href before clicking to verify it's correct
    const href = await manageDecksLink.getAttribute('href');
    if (!href || !href.includes('/admin/classes/')) {
      throw new Error(`Invalid href for Manage Decks link: ${href}`);
    }

    // Use Promise.all to wait for both the navigation and the click
    await Promise.all([
      this.page.waitForURL(/\/admin\/classes\/[^/]+$/, { timeout: 15000 }),
      manageDecksLink.click(),
    ]);

    // Wait for the page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Network might already be idle
    });
  }
}

/**
 * Helper to setup admin authentication for tests
 * Note: This assumes you have Clerk test credentials set up
 */
export async function setupAdminAuth(page: Page) {
  // Check if we need to sign in
  const currentUrl = page.url();

  if (currentUrl.includes('sign-in') || currentUrl.includes('sign-up')) {
    // This is a placeholder - you'll need to implement actual Clerk authentication
    // For now, we'll assume the user is already authenticated in the test environment
    console.warn('Authentication required. Please ensure test user is logged in as admin.');
  }
}
