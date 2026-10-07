import { useEffect } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifications } from '@mantine/notifications';
import { useForm } from 'react-hook-form';
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
      if (!webhook) throw new Error('No webhook selected.');
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
        title: 'Webhook updated',
        message: `${updated.name} is ready to receive events.`,
      });
      onClose();
    } catch (error) {
      if (isApiError(error) && error.payload) {
        for (const [field, messages] of Object.entries(error.payload)) {
          if (field === 'name' || field === 'url') {
            setError(field, {
              type: 'server',
              message: messages[0] ?? 'Invalid value',
            });
          }
        }
        return;
      }
      setError('root.server', {
        type: 'server',
        message: error instanceof Error ? error.message : 'Unable to update webhook',
      });
    }
  });

  return (
    <Modal
      opened={Boolean(webhook)}
      onClose={onClose}
      title="Edit webhook"
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.35, blur: 3 }}
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the label or destination used for this integration.
          </Text>
          <TextInput
            label="Name"
            placeholder="Payment received"
            autoFocus
            error={errors.name?.message}
            {...register('name')}
          />
          <TextInput
            label="Endpoint URL"
            placeholder="https://api.example.com/webhooks"
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
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
