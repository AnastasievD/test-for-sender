import { expect, test } from '@playwright/test';
import { i18n } from '../src/i18n';

test('signs in, searches, validates, edits and signs out', async ({ page }) => {
  await page.goto('/webhooks?page=1');

  await expect(page.getByRole('heading', { name: i18n.t('login.title') })).toBeVisible();
  await page.getByRole('button', { name: i18n.t('actions.signIn') }).click();

  await expect(page).toHaveURL(/\/webhooks\?page=1$/);
  await expect(page.getByRole('heading', { name: i18n.t('webhooks.title') })).toBeVisible();
  await expect(page.getByText('Customer created', { exact: true })).toBeVisible();

  const search = page.getByRole('textbox', {
    name: i18n.t('webhooks.searchPlaceholder'),
  });
  await search.fill('payment');
  await expect(page).toHaveURL(/search=payment/);
  await expect(page.getByText('Payment received', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment failed', { exact: true })).toBeVisible();
  await expect(page.getByText('Customer created', { exact: true })).toBeHidden();

  await page
    .getByRole('button', {
      name: i18n.t('actions.editWebhook', { name: 'Payment received' }),
    })
    .click();
  const dialog = page.getByRole('dialog', { name: i18n.t('webhooks.edit.title') });
  await expect(dialog).toBeVisible();

  const endpointInput = dialog.getByLabel(i18n.t('webhooks.edit.urlLabel'));
  await endpointInput.fill('ftp://invalid.example.com');
  await dialog.getByRole('button', { name: i18n.t('actions.saveChanges') }).click();
  await expect(dialog.getByText(i18n.t('validation.httpUrl'))).toBeVisible();

  await endpointInput.fill('https://api.example.com/hooks/payment-captured');
  await dialog.getByLabel(i18n.t('webhooks.edit.nameLabel')).fill('Payment captured');
  await dialog.getByRole('button', { name: i18n.t('actions.saveChanges') }).click();

  await expect(
    page.getByText(i18n.t('webhooks.edit.successTitle'), { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Payment captured', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: i18n.t('actions.signOut') }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: i18n.t('actions.signIn') })).toBeVisible();
});
