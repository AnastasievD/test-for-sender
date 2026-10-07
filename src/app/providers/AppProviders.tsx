import type { PropsWithChildren } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthContext';
import { queryClient } from './queryClient';

const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 7,
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontWeight: '650',
  },
  defaultRadius: 'md',
});

export const AppProviders = ({ children }: PropsWithChildren) => (
  <MantineProvider theme={theme} defaultColorScheme="light">
    <Notifications position="top-right" />
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>
);
