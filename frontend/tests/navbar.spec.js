import { test, expect } from '@playwright/test';

test.describe('NavBar & Internationalization Flow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
    });

    test('Guest users should only see Dashboard and Login links', async ({ page }) => {
        await expect(page.locator('a.nav-link', { hasText: /Dashboard/i })).toBeVisible();

        const profileLink = page.locator('a.nav-link', { hasText: /Profile/i });
        const friendsLink = page.locator('a.nav-link', { hasText: /Friends/i });

        await expect(profileLink).not.toBeVisible();
        await expect(friendsLink).not.toBeVisible();
    });

    test('Language Picker opens dropdown and changes language', async ({ page }) => {
        const langPickerBtn = page.locator('button[title="Select language"]');
        await expect(langPickerBtn).toBeVisible();
        await langPickerBtn.click();

        const frenchOption = page.locator('button', { hasText: /Français/i });
        await expect(frenchOption).toBeVisible();

        await frenchOption.click();

        await expect(frenchOption).not.toBeVisible();

        await expect(langPickerBtn).toContainText('FR');
    });
});