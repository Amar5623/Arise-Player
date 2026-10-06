import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './Root';
import { KitScreen } from '@/screens/kit/KitScreen';

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/kit', element: <KitScreen /> },
      // Phase 2: only the kit exists. Phase 4 replaces this with the tab shell.
      { path: '*', element: <Navigate to="/kit" replace /> },
    ],
  },
]);
