/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HierarchicalApp } from './components/hierarchical/HierarchicalApp';

export default function App() {
  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col bg-[#f8f7f4] dark:bg-slate-950 text-[#1a2420] dark:text-slate-100 font-sans antialiased" dir="rtl">
      <HierarchicalApp />
    </div>
  );
}
