import { expect, test } from '@playwright/test';

/**
 * Core happy-path E2E for CARGO Figma replica.
 * Covers the main user journey that maps 1:1 to the Figma screens:
 * Splash → Sign Up → Verify (OTP) → Enable Location → Home
 * → Destination (map confirm) → Select Service
 *
 * This is the primary acceptance test.
 */
test.describe('CARGO full booking flow', () => {
  test('user can complete signup → verify → location → book a ride', async ({ page }) => {
    // Start at root (splash auto-navigates)
    await page.goto('/');

    // Wait for splash to auto-advance to signup (or click through)
    await page.waitForTimeout(800); // allow splash animation

    // On Sign Up screen
    await expect(page.getByText('Create account')).toBeVisible();

    // Fill minimal form
    await page.getByPlaceholder('Your full name').fill('Alex Rivera');
    await page.getByPlaceholder('+1 (555) 000-0000').fill('+1 (555) 987-6543');

    // Continue (primary button)
    await page.getByRole('button', { name: /continue with phone/i }).click();

    // Verify phone screen (OTP 4 boxes)
    await expect(page.getByText('Verify phone number')).toBeVisible();

    // Fill the 4 OTP inputs (they have no labels, use test ids or sequential fill)
    const otpInputs = page.locator('input[maxlength="1"]');
    await otpInputs.nth(0).fill('1');
    await otpInputs.nth(1).fill('2');
    await otpInputs.nth(2).fill('3');
    await otpInputs.nth(3).fill('4');

    await page.getByRole('button', { name: 'Verify' }).click();

    // Enable Location screen
    await expect(page.getByText('Enable location')).toBeVisible();
    await page.getByRole('button', { name: /enable location services/i }).click();

    // Now on Home
    await expect(page.getByText(/good morning/i)).toBeVisible();
    await expect(page.getByText('Where to?')).toBeVisible(); // from the map teaser or search

    // Go to destination via quick action or search area
    // The map is lazy loaded — click the prominent "Where to?" area or the Set destination on map button
    await page.getByText('Where to?').click();

    // We are now on the interactive map destination screen
    await page.waitForTimeout(1200); // allow map to initialize

    // The confirm button in the floating panel (text from MapView)
    const setDestinationBtn = page.getByTestId('set-destination-btn');
    await expect(setDestinationBtn).toBeVisible({ timeout: 20000 });

    // Click it — this should update store and navigate to /service
    await setDestinationBtn.click();

    // Arrive at Select Service screen
    await expect(page.getByText('Choose your ride')).toBeVisible();
    await expect(page.getByText(/Economy|Comfort|Premium/i)).toBeVisible();

    // Pick the first available ride type (click the first ride card)
    const firstRideCard = page.locator('.ride-card').first();
    await firstRideCard.click();

    // Should land on Payment
    await expect(page.getByText('Payment')).toBeVisible();
    await expect(page.getByText(/Confirm & Pay/i)).toBeVisible();

    // Success — the core flow from Figma screens 1-2-7-8-9-10/11-14-17 is exercised
  });
});
