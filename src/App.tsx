/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HierarchicalApp } from './components/hierarchical/HierarchicalApp';
import { ThemeProvider } from './utils/theme';

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f1512] text-[#1a2420] dark:text-[#e5ede8] font-sans antialiased selection:bg-[#174235] selection:text-white dark:selection:bg-emerald-600 transition-colors duration-200" dir="rtl">
        <HierarchicalApp />
      </div>
    </ThemeProvider>
  );
}
