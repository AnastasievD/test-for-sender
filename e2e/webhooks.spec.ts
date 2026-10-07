import { expect, test } from '@playwright/test';

test('signs in, searches, validates, edits and signs out', async ({ page }) => {
  await page.goto('/webhooks?page=1');

  await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/webhooks\?page=1$/);
  await expect(page.getByRole('heading', { name: 'Webhooks' })).toBeVisible();
  await expect(page.getByText('Customer created', { exact: true })).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search webhooks by name' });
  await search.fill('payment');
  await expect(page).toHaveURL(/search=payment/);
  await expect(page.getByText('Payment received', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment failed', { exact: true })).toBeVisible();
  await expect(page.getByText('Customer created', { exact: true })).toBeHidden();

  await page.getByRole('button', { name: 'Edit Payment received' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit webhook' });
  await expect(dialog).toBeVisible();

  const endpointInput = dialog.getByLabel('Endpoint URL');
  await endpointInput.fill('ftp://invalid.example.com');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog.getByText('Enter a valid HTTP/HTTPS URL')).toBeVisible();

  await endpointInput.fill('https://api.example.com/hooks/payment-captured');
  await dialog.getByLabel('Name').fill('Payment captured');
  await dialog.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText('Webhook updated', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment captured', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
