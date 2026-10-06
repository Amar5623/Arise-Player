import '@fontsource/saira-semi-condensed/500.css';
import '@fontsource/saira-semi-condensed/600.css';
import '@fontsource/saira-semi-condensed/700.css';
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createRouter } from './app/router';
import { DEMO } from './db/db';
import { todayISO } from './lib/dates';

async function start() {
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root');
  if (DEMO) {
    const { seedDemo } = await import('./db/demo/seed');
    await seedDemo(todayISO());
  }
  const router = createRouter();
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void start();
