import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';
import { App } from './app/App';

const enableMocking = async () => {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' });
};

void enableMocking().then(() => {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element was not found.');

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
