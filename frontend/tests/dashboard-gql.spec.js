import { test, expect } from '@playwright/test';

test.describe('Dashboard GraphQL Interception', () => {

    test('handles backend GraphQL errors gracefully on the dashboard', async ({ page }) => {
        await page.route('**/graphql', async (route) => {
            const request = route.request();
            const postData = request.postDataJSON();

            if (postData && postData.query.includes('GlobalStats')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        errors: [{ message: "Database connection failed" }]
                    })
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('http://localhost:5173/');

        const playTitle = page.locator('.play-title');
        await expect(playTitle).toBeVisible();

        const statBoxes = page.locator('.global-stat');
        await expect(statBoxes.first()).toBeVisible();
    });
});