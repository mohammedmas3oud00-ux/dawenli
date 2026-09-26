import { expect, test } from '@playwright/test';

test.describe('Dawenli published platform', () => {
  test('serves the SPA and keeps API responses separate from the fallback', async ({ page, request }) => {
    const appResponse = await page.goto('/');
    expect(appResponse?.status()).toBe(200);
    await expect(page).toHaveTitle(/دوّنلي/);

    const apiResponse = await request.get('/api/ai/credential');
    expect(apiResponse.status()).toBe(401);
    expect(apiResponse.headers()['content-type']).toContain('application/json');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('keeps the app free of horizontal overflow at mobile widths', async ({ page }) => {
    for (const width of [320, 360, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test('allows a new guest to reach the empty عبادات setup without seed data', async ({ page }) => {
    await page.goto('/');
    const guest = page.getByText('المتابعة كضيف محلي');
    await expect(guest).toBeVisible({ timeout: 20_000 });
    await guest.click();
    await expect(page.getByText('جلسة ضيف محلية')).toBeVisible();
    await page.getByText('العبادات والأوراد').first().click();
    await expect(page.getByText('ابدأ منظومة عباداتك')).toBeVisible();
    await expect(page.getByText('استعادة البيانات الأولية')).toHaveCount(0);
    await expect(page.getByText('مخطط SQL')).toHaveCount(0);
  });
});
