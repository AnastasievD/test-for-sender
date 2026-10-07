import { useEffect, useState } from 'react';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '../../../api/errors';
import { updateWebhook } from '../api';
import type { Webhook, WebhookUpdate } from '../types';

interface WebhookEditModalProps {
  webhook: Webhook | null;
  onClose: () => void;
}

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const WebhookEditModal = ({ webhook, onClose }: WebhookEditModalProps) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<WebhookUpdate>({
    initialValues: { name: '', url: '' },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      url: (value) => (isHttpUrl(value) ? null : 'Enter a valid HTTP/HTTPS URL'),
    },
  });

  useEffect(() => {
    if (!webhook) return;
    form.setValues({ name: webhook.name, url: webhook.url });
    form.resetDirty({ name: webhook.name, url: webhook.url });
    form.clearErrors();
    setSubmitError(null);
    // The form object is stable; the selected webhook is the reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhook]);

  const mutation = useMutation({
    mutationFn: (values: WebhookUpdate) => {
      if (!webhook) throw new Error('No webhook selected.');
      return updateWebhook(webhook.id, values);
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      notifications.show({
        color: 'teal',
        title: 'Webhook updated',
        message: `${updated.name} is ready to receive events.`,
      });
      onClose();
    },
    onError: (error) => {
      if (isApiError(error) && error.payload) {
        for (const [field, messages] of Object.entries(error.payload)) {
          form.setFieldError(field, messages[0] ?? 'Invalid value');
        }
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'Unable to update webhook');
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setSubmitError(null);
    mutation.mutate({ name: values.name.trim(), url: values.url.trim() });
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
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the label or destination used for this integration.
          </Text>
          <TextInput
            label="Name"
            placeholder="Payment received"
            autoFocus
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Endpoint URL"
            placeholder="https://api.example.com/webhooks"
            {...form.getInputProps('url')}
          />
          {submitError && (
            <Text c="red.7" size="sm" role="alert">{submitError}</Text>
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={!form.isDirty()}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
