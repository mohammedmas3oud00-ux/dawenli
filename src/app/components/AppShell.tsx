import React from 'react';

export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="h-dvh w-full overflow-hidden flex flex-col bg-[#f8f7f4] dark:bg-slate-950 text-[#1a2420] dark:text-slate-100 font-sans antialiased" dir="rtl">
    {children}
  </div>
);
