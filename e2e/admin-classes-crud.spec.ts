import { test, expect } from '@playwright/test';
import { ClassTestHelpers } from './utils/test-helpers';

/**
 * Admin Classes CRUD E2E Tests
 *
 * This test suite covers:
 * - CREATE: Creating classes with various configurations
 * - READ: Viewing and listing classes
 * - UPDATE: Editing class details
 * - DELETE: Removing classes
 * - Edge cases and validation
 */

test.describe('Admin Classes CRUD Operations', () => {
  let helpers: ClassTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ClassTestHelpers(page);
    await helpers.navigateToClassesPage();
    await helpers.waitForPageLoad();
  });

  /**
   * ============================================================
   * CREATE OPERATION TESTS
   * ============================================================
   */
  test.describe('CREATE Operations', () => {
    test('TC-1.1: Create a new class with all fields', async ({ page }) => {
      const initialCount = await helpers.getTotalClassesCount();

      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Security and Risk Management',
        description:
          'Covers security governance, risk management, compliance, and legal requirements',
        icon: '🛡️ Shield',
        color: 'Blue',
        order: 1,
        isPublished: true,
      });
      await helpers.submitForm('Create');

      // Verify success toast
      await helpers.waitForToast('Class created successfully');

      // Verify class appears in list
      const exists = await helpers.classExists('Security and Risk Management');
      expect(exists).toBe(true);

      // Verify count increased
      const newCount = await helpers.getTotalClassesCount();
      expect(newCount).toBe(initialCount + 1);

      // Verify it's not a draft
      const isDraft = await helpers.isDraft('Security and Risk Management');
      expect(isDraft).toBe(false);
    });

    test('TC-1.2: Create an unpublished draft class', async ({ page }) => {
      const initialPublishedCount = await helpers.getPublishedClassesCount();

      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Asset Security Draft',
        description: 'Information and asset classification, ownership, privacy',
        icon: '🔒 Secure Lock',
        color: 'Green',
        order: 2,
        isPublished: false,
      });
      await helpers.submitForm('Create');

      await helpers.waitForToast('Class created successfully');

      // Verify class exists and has draft badge
      const exists = await helpers.classExists('Asset Security Draft');
      expect(exists).toBe(true);

      const isDraft = await helpers.isDraft('Asset Security Draft');
      expect(isDraft).toBe(true);

      // Verify published count didn't increase
      const newPublishedCount = await helpers.getPublishedClassesCount();
      expect(newPublishedCount).toBe(initialPublishedCount);
    });

    test('TC-1.3: Validation - Create class without required name', async ({
      page,
    }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: '', // Empty name
        description: 'Test description',
      });
      await helpers.submitForm('Create', false); // Don't wait for close (validation error)

      // Should show error toast
      await helpers.waitForToast('Class name is required');

      // Dialog should still be open
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('TC-1.4: Create class with minimal required fields', async ({
      page,
    }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Minimal Class Test',
      });
      await helpers.submitForm('Create');

      await helpers.waitForToast('Class created successfully');

      const exists = await helpers.classExists('Minimal Class Test');
      expect(exists).toBe(true);
    });

    test('TC-1.5: Cancel class creation', async ({ page }) => {
      const initialCount = await helpers.getTotalClassesCount();

      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Cancelled Class',
        description: 'This should not be created',
      });
      await helpers.cancelForm();

      // Verify class was not created
      const exists = await helpers.classExists('Cancelled Class');
      expect(exists).toBe(false);

      // Verify count unchanged
      const newCount = await helpers.getTotalClassesCount();
      expect(newCount).toBe(initialCount);
    });
  });

  /**
   * ============================================================
   * READ OPERATION TESTS
   * ============================================================
   */
  test.describe('READ Operations', () => {
    test('TC-2.1: View all classes list', async ({ page }) => {
      // Verify stats are displayed
      const totalCount = await helpers.getTotalClassesCount();
      expect(totalCount).toBeGreaterThanOrEqual(0);

      const publishedCount = await helpers.getPublishedClassesCount();
      expect(publishedCount).toBeGreaterThanOrEqual(0);
      expect(publishedCount).toBeLessThanOrEqual(totalCount);

      // Verify "All Classes" section is visible
      await expect(page.locator('text="All Classes"')).toBeVisible();
    });

    test('TC-2.2: View individual class details via Manage Decks', async ({
      page,
    }) => {
      // First create a test class
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Test Class for Details',
        description: 'Test description',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Click Manage Decks
      await helpers.clickManageDecks('Test Class for Details');

      // Verify navigation to class detail page
      await expect(page).toHaveURL(/\/admin\/classes\/[^/]+$/);
    });

    test('TC-2.3: Verify empty state when no classes exist', async ({
      page,
    }) => {
      const totalCount = await helpers.getTotalClassesCount();

      if (totalCount === 0) {
        // Should show empty state
        await expect(
          page.locator('text="No classes created yet"')
        ).toBeVisible();
        await expect(
          page.locator('button:has-text("Create Your First Class")')
        ).toBeVisible();
      }
    });
  });

  /**
   * ============================================================
   * UPDATE OPERATION TESTS
   * ============================================================
   */
  test.describe('UPDATE Operations', () => {
    test('TC-3.1: Update class name and description', async ({ page }) => {
      // Create a class first
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Original Class Name',
        description: 'Original description',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Edit the class
      await helpers.clickEditClass('Original Class Name');
      await helpers.fillClassForm({
        name: 'Updated Class Name',
        description: 'Updated description for 2025',
      });
      await helpers.submitForm('Update');

      await helpers.waitForToast('Class updated successfully');

      // Verify old name doesn't exist
      const oldExists = await helpers.classExists('Original Class Name');
      expect(oldExists).toBe(false);

      // Verify new name exists
      const newExists = await helpers.classExists('Updated Class Name');
      expect(newExists).toBe(true);
    });

    test('TC-3.2: Change class color and icon', async ({ page }) => {
      // Create a class
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Test Color Change',
        icon: '🔐 Lock',
        color: 'Purple',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Edit to change color and icon
      await helpers.clickEditClass('Test Color Change');
      await helpers.fillClassForm({
        name: 'Test Color Change', // Keep same name
        icon: '🎯 Target',
        color: 'Red',
      });
      await helpers.submitForm('Update');

      await helpers.waitForToast('Class updated successfully');

      // Verify class still exists
      const exists = await helpers.classExists('Test Color Change');
      expect(exists).toBe(true);
    });

    test('TC-3.3: Toggle publish status from draft to published', async ({
      page,
    }) => {
      const initialPublishedCount = await helpers.getPublishedClassesCount();

      // Create draft class
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Draft to Published',
        isPublished: false,
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Verify it's a draft
      let isDraft = await helpers.isDraft('Draft to Published');
      expect(isDraft).toBe(true);

      // Edit to publish
      await helpers.clickEditClass('Draft to Published');
      await helpers.fillClassForm({
        name: 'Draft to Published',
        isPublished: true,
      });
      await helpers.submitForm('Update');

      await helpers.waitForToast('Class updated successfully');

      // Verify no longer a draft
      isDraft = await helpers.isDraft('Draft to Published');
      expect(isDraft).toBe(false);

      // Verify published count increased
      const newPublishedCount = await helpers.getPublishedClassesCount();
      expect(newPublishedCount).toBe(initialPublishedCount + 1);
    });

    test('TC-3.4: Update display order', async ({ page }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Test Order Change',
        order: 5,
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Edit order
      await helpers.clickEditClass('Test Order Change');
      await helpers.fillClassForm({
        name: 'Test Order Change',
        order: 1,
      });
      await helpers.submitForm('Update');

      await helpers.waitForToast('Class updated successfully');
    });

    test('TC-3.5: Cancel update operation', async ({ page }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Unchanged Class',
        description: 'Original',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Start editing but cancel
      await helpers.clickEditClass('Unchanged Class');
      await helpers.fillClassForm({
        name: 'This Should Not Save',
        description: 'Changed',
      });
      await helpers.cancelForm();

      // Verify original name still exists
      const exists = await helpers.classExists('Unchanged Class');
      expect(exists).toBe(true);

      // Verify new name doesn't exist
      const changedExists = await helpers.classExists('This Should Not Save');
      expect(changedExists).toBe(false);
    });
  });

  /**
   * ============================================================
   * DELETE OPERATION TESTS
   * ============================================================
   */
  test.describe('DELETE Operations', () => {
    test('TC-4.1: Delete a class successfully', async ({ page }) => {
      // Create a class to delete
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Class to Delete',
        description: 'This will be deleted',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      const initialCount = await helpers.getTotalClassesCount();

      // Delete the class
      await helpers.clickDeleteClass('Class to Delete');
      await helpers.confirmDelete();

      await helpers.waitForToast('Class deleted successfully');

      // Verify class no longer exists
      const exists = await helpers.classExists('Class to Delete');
      expect(exists).toBe(false);

      // Verify count decreased
      const newCount = await helpers.getTotalClassesCount();
      expect(newCount).toBe(initialCount - 1);
    });

    test('TC-4.2: Cancel delete operation', async ({ page }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Do Not Delete',
        description: 'Should remain',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      const initialCount = await helpers.getTotalClassesCount();

      // Start delete but cancel
      await helpers.clickDeleteClass('Do Not Delete');
      await helpers.cancelDelete();

      // Verify class still exists
      const exists = await helpers.classExists('Do Not Delete');
      expect(exists).toBe(true);

      // Verify count unchanged
      const newCount = await helpers.getTotalClassesCount();
      expect(newCount).toBe(initialCount);
    });

    test('TC-4.3: Verify delete warning message appears', async ({ page }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Warning Test Class',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      await helpers.clickDeleteClass('Warning Test Class');

      // Verify warning message
      await expect(
        page.locator('text="This will permanently delete the class and all its decks and flashcards."')
      ).toBeVisible();
      await expect(page.locator('text="This action cannot be undone"')).toBeVisible();

      await helpers.cancelDelete();
    });
  });

  /**
   * ============================================================
   * EDGE CASES AND VALIDATION TESTS
   * ============================================================
   */
  test.describe('Edge Cases and Validation', () => {
    test('TC-5.1: Create class with special characters in name', async ({
      page,
    }) => {
      const specialName = 'Test & "Special" Characters <>';

      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: specialName,
        description: 'Testing special characters',
      });
      await helpers.submitForm('Create');

      await helpers.waitForToast('Class created successfully');

      const exists = await helpers.classExists(specialName);
      expect(exists).toBe(true);
    });

    test('TC-5.2: Create class with very long description', async ({
      page,
    }) => {
      const longDescription =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);

      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Long Description Test',
        description: longDescription,
      });
      await helpers.submitForm('Create');

      await helpers.waitForToast('Class created successfully');

      const exists = await helpers.classExists('Long Description Test');
      expect(exists).toBe(true);
    });

    test('TC-5.3: Create class with duplicate name', async () => {
      const duplicateName = 'Duplicate Name Test';

      // Create first class
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: duplicateName,
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Try to create second class with same name
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: duplicateName,
      });
      await helpers.submitForm('Create');

      // Wait for the operation to complete
      await helpers.waitForToast('Class created successfully');

      // Verify the class exists (duplicates are allowed in current implementation)
      const exists = await helpers.classExists(duplicateName);
      expect(exists).toBe(true);
    });

    test('TC-5.4: Navigate away and back to verify persistence', async ({
      page,
    }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Persistence Test Class',
        description: 'Testing data persistence',
      });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Navigate away
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      // Navigate back
      await helpers.navigateToClassesPage();
      await helpers.waitForPageLoad();

      // Verify class still exists
      const exists = await helpers.classExists('Persistence Test Class');
      expect(exists).toBe(true);
    });

    test('TC-5.5: Test with order value of 0', async ({ page }) => {
      await helpers.clickNewClass();
      await helpers.fillClassForm({
        name: 'Zero Order Test',
        order: 0,
      });
      await helpers.submitForm('Create');

      await helpers.waitForToast('Class created successfully');

      const exists = await helpers.classExists('Zero Order Test');
      expect(exists).toBe(true);
    });

    test('TC-5.6: Test rapid consecutive operations', async ({ page }) => {
      // Increase timeout for this test since it involves multiple sequential operations
      test.setTimeout(60000);

      const testName = 'Rapid Test Class';

      // Rapid create
      await helpers.clickNewClass();
      await helpers.fillClassForm({ name: testName });
      await helpers.submitForm('Create');
      await helpers.waitForToast('Class created successfully');

      // Rapid update
      await helpers.clickEditClass(testName);
      await helpers.fillClassForm({
        name: testName + ' Updated',
      });
      await helpers.submitForm('Update');
      await helpers.waitForToast('Class updated successfully');

      // Rapid delete
      await helpers.clickDeleteClass(testName + ' Updated');
      await helpers.confirmDelete();
      await helpers.waitForToast('Class deleted successfully');

      // Verify final state
      const exists = await helpers.classExists(testName + ' Updated');
      expect(exists).toBe(false);
    });
  });
});
