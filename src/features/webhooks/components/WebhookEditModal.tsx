import { useEffect } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifications } from '@mantine/notifications';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '../../../api/errors';
import { updateWebhook } from '../api';
import {
  webhookUpdateSchema,
  type Webhook,
  type WebhookUpdate,
} from '../schema';

interface WebhookEditModalProps {
  webhook: Webhook | null;
  onClose: () => void;
}

export const WebhookEditModal = ({ webhook, onClose }: WebhookEditModalProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WebhookUpdate>({
    resolver: zodResolver(webhookUpdateSchema),
    defaultValues: { name: '', url: '' },
  });

  useEffect(() => {
    if (!webhook) return;
    reset({ name: webhook.name, url: webhook.url });
    clearErrors();
  }, [clearErrors, reset, webhook]);

  const mutation = useMutation({
    mutationFn: (values: WebhookUpdate) => {
      if (!webhook) throw new Error(t('errors.updateWebhookFailed'));
      return updateWebhook(webhook.id, values);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      const updated = await mutation.mutateAsync(values);
      await queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      notifications.show({
        color: 'teal',
        title: t('webhooks.edit.successTitle'),
        message: t('webhooks.edit.successMessage', { name: updated.name }),
      });
      onClose();
    } catch (error) {
      if (isApiError(error) && error.payload) {
        for (const [field, messages] of Object.entries(error.payload)) {
          if (field === 'name' || field === 'url') {
            setError(field, {
              type: 'server',
              message: messages[0] ?? t('common.invalidValue'),
            });
          }
        }
        return;
      }
      setError('root.server', {
        type: 'server',
        message:
          error instanceof Error ? error.message : t('errors.updateWebhookFailed'),
      });
    }
  });

  return (
    <Modal
      opened={Boolean(webhook)}
      onClose={onClose}
      title={t('webhooks.edit.title')}
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.35, blur: 3 }}
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('webhooks.edit.description')}
          </Text>
          <TextInput
            label={t('webhooks.edit.nameLabel')}
            placeholder={t('webhooks.edit.namePlaceholder')}
            autoFocus
            error={errors.name?.message}
            {...register('name')}
          />
          <TextInput
            label={t('webhooks.edit.urlLabel')}
            placeholder={t('webhooks.edit.urlPlaceholder')}
            error={errors.url?.message}
            {...register('url')}
          />
          {errors.root?.server?.message && (
            <Text c="red.7" size="sm" role="alert">
              {errors.root.server.message}
            </Text>
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              {t('actions.saveChanges')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
