import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export const InstallAppButton: React.FC = () => {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const handle = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handle);
    return () => window.removeEventListener('beforeinstallprompt', handle);
  }, []);
  if (!promptEvent) return null;
  const install = async () => {
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };
  return (
    <button type="button" onClick={install} aria-label="تثبيت دوّنلي كتطبيق" title="تثبيت دوّنلي كتطبيق" className="p-2 rounded-xl text-[#55615a] dark:text-slate-300 hover:bg-[#f2efe8] dark:hover:bg-slate-800 border border-[#e8e5de] dark:border-slate-700">
      <Download className="w-4 h-4" />
    </button>
  );
};
