/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './features/auth/providers/AuthProvider';
import { AppShell } from './app/components/AppShell';
import { AppRouter } from './app/router/AppRouter';

export default function App() {
  return (
    <AppShell>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppShell>
  );
}
