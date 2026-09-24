import React, { useState, useEffect } from 'react';
import { 
  fetchPrayerTimes, 
  PrayerTimesData 
} from '../../utils/speechRecognition';
import { playFocusSound, stopAdhanSound } from '../../utils/audioChime';
import { 
  Bell, 
  BellOff, 
  Clock, 
  MapPin, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Sparkles,
  Volume2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface PrayerTimesCardProps {
  onAdhanNotify?: (prayerName: string) => void;
  className?: string;
  isCompact?: boolean;
}

interface PrayerItem {
  id: string;
  name: string;
  timeStr: string;
  icon: React.ReactNode;
}

export const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({
  onAdhanNotify,
  className = '',
  isCompact = false,
}) => {
  const [data, setData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('dawenli_adhan_sound') !== 'false';
  });
  const [nextPrayer, setNextPrayer] = useState<{ name: string; minutesRemaining: number; timeStr: string } | null>(null);
  const [lastNotifiedPrayer, setLastNotifiedPrayer] = useState<string>('');
  const [cityLabel, setCityLabel] = useState<string>('القاهرة / التوقيت المحلي');

  // Load Prayer Times
  const loadTimes = async () => {
    setLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await fetchPrayerTimes({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
              setData(res);
              setCityLabel('موقعك الجغرافي المباشر');
            } catch {
              const fallback = await fetchPrayerTimes();
              setData(fallback);
            } finally {
              setLoading(false);
            }
          },
          async () => {
            const fallback = await fetchPrayerTimes();
            setData(fallback);
            setLoading(false);
          },
          { timeout: 4000 }
        );
      } else {
        const fallback = await fetchPrayerTimes();
        setData(fallback);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimes();
  }, []);

  // Compute Next Prayer and Trigger Adhan Alert
  useEffect(() => {
    if (!data) return;

    const calculateNext = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const prayers: { id: string; name: string; timeStr: string }[] = [
        { id: 'Fajr', name: 'الفجر', timeStr: data.Fajr },
        { id: 'Sunrise', name: 'الشروق', timeStr: data.Sunrise },
        { id: 'Dhuhr', name: 'الظهر', timeStr: data.Dhuhr },
        { id: 'Asr', name: 'العصر', timeStr: data.Asr },
        { id: 'Maghrib', name: 'المغرب', timeStr: data.Maghrib },
        { id: 'Isha', name: 'العشاء', timeStr: data.Isha },
      ];

      for (const p of prayers) {
        const [h, m] = p.timeStr.split(':').map(Number);
        const prayerMinutes = h * 60 + m;
        const diff = prayerMinutes - currentMinutes;

        // Check if prayer is right now (within current minute)
        if (diff === 0 && lastNotifiedPrayer !== p.id) {
          setLastNotifiedPrayer(p.id);
          if (soundEnabled) {
            playFocusSound('adhan');
          }
          if (onAdhanNotify) {
            onAdhanNotify(p.name);
          }
        }

        if (diff > 0) {
          setNextPrayer({ name: p.name, minutesRemaining: diff, timeStr: p.timeStr });
          return;
        }
      }

      // If all passed today, next is Fajr tomorrow
      const [fajrH, fajrM] = data.Fajr.split(':').map(Number);
      const fajrMinutesTomorrow = 24 * 60 - currentMinutes + (fajrH * 60 + fajrM);
      setNextPrayer({ name: 'الفجر', minutesRemaining: fajrMinutesTomorrow, timeStr: data.Fajr });
    };

    calculateNext();
    const interval = setInterval(calculateNext, 30000);
    return () => clearInterval(interval);
  }, [data, soundEnabled, lastNotifiedPrayer, onAdhanNotify]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('dawenli_adhan_sound', String(next));
    if (next) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try {
          Notification.requestPermission();
        } catch {}
      }
      playFocusSound('adhan');
    } else {
      stopAdhanSound();
    }
  };

  const prayersList: PrayerItem[] = data
    ? [
        { id: 'Fajr', name: 'الفجر', timeStr: data.Fajr, icon: <Moon className="w-3.5 h-3.5 text-indigo-500" /> },
        { id: 'Sunrise', name: 'الشروق', timeStr: data.Sunrise, icon: <Sunrise className="w-3.5 h-3.5 text-amber-500" /> },
        { id: 'Dhuhr', name: 'الظهر', timeStr: data.Dhuhr, icon: <Sun className="w-3.5 h-3.5 text-amber-600" /> },
        { id: 'Asr', name: 'العصر', timeStr: data.Asr, icon: <Sun className="w-3.5 h-3.5 text-orange-500" /> },
        { id: 'Maghrib', name: 'المغرب', timeStr: data.Maghrib, icon: <Sunset className="w-3.5 h-3.5 text-rose-500" /> },
        { id: 'Isha', name: 'العشاء', timeStr: data.Isha, icon: <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> },
      ]
    : [];

  const formatDiff = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0) return `${hours} س و ${m} د`;
    return `${m} دقيقة`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-[#e8e4db] dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs text-[#718278] dark:text-slate-400 ${className}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>جاري ضبط مواقيت الصلاة والأذان...</span>
      </div>
    );
  }

  return (
    <div className={`bg-linear-to-br from-[#fcfbf9] to-[#f4f7f4] dark:from-slate-900 dark:to-slate-900/90 border border-[#dce6e0] dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs relative transition-all ${className}`}>
      
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-[#e6eee8] dark:border-slate-800">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#174235] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <span className="text-sm">🕌</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#174235] dark:text-emerald-400 truncate">
                مواقيت الصلاة والأذان
              </h3>
              {data?.hijriMonthArabic && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#174235] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {data.hijriMonthArabic}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#627369] dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-[#174235] dark:text-emerald-500 shrink-0" />
              <span className="truncate">{cityLabel}</span>
            </p>
          </div>
        </div>

        {/* Adhan Sound & Refresh Toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              soundEnabled
                ? 'bg-[#ebf4f0] dark:bg-emerald-950/80 text-[#174235] dark:text-emerald-300 border-[#cfe3d9] dark:border-emerald-800 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-[#86968c] dark:text-slate-500 border-[#e8e4db] dark:border-slate-700'
            }`}
            title={soundEnabled ? 'تنبيه الأذان مفعل' : 'تنبيه الأذان مكتوم'}
          >
            {soundEnabled ? <Bell className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400 shrink-0" /> : <BellOff className="w-3.5 h-3.5 shrink-0" />}
            <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'الأذان مفعّل' : 'مكتوم'}</span>
          </button>

          <button
            type="button"
            onClick={loadTimes}
            className="p-1.5 sm:p-2 bg-white dark:bg-slate-800 hover:bg-[#f2efe8] dark:hover:bg-slate-700 text-[#55635b] dark:text-slate-300 rounded-xl border border-[#e8e4db] dark:border-slate-700 transition-colors cursor-pointer shrink-0"
            title="تحديث المواقيت"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Next Prayer Countdown Spotlight */}
      {nextPrayer && (
        <div className="mt-3 p-2.5 sm:p-3 bg-white dark:bg-slate-800/80 border border-[#cfe0d5] dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#627369] dark:text-slate-400 block">الصلاة القادمة:</span>
              <span className="text-xs sm:text-sm font-black text-[#174235] dark:text-emerald-300">
                صلاة {nextPrayer.name} الساعة {nextPrayer.timeStr}
              </span>
            </div>
          </div>
          <div className="flex items-center sm:block justify-between sm:text-left shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#f0eee9] dark:border-slate-700/60">
            <span className="text-[10px] text-[#718278] dark:text-slate-400 block font-medium">متبقي عليها:</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
              {formatDiff(nextPrayer.minutesRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* 5 Daily Prayers Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 text-center">
        {prayersList.map((prayer) => {
          const isNext = nextPrayer?.name === prayer.name;
          return (
            <div
              key={prayer.id}
              className={`p-2 rounded-xl border transition-all ${
                isNext
                  ? 'bg-[#174235] text-white border-[#174235] shadow-xs scale-102 font-bold'
                  : 'bg-white dark:bg-slate-800/60 border-[#e8e5de] dark:border-slate-700/60 text-[#2a3630] dark:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {prayer.icon}
                <span className={`text-[11px] font-bold ${isNext ? 'text-amber-300' : 'text-[#627369] dark:text-slate-400'}`}>
                  {prayer.name}
                </span>
              </div>
              <div className={`text-xs font-mono font-black ${isNext ? 'text-white' : 'text-[#1a2420] dark:text-slate-100'}`}>
                {prayer.timeStr}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
