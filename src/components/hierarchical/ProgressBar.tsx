import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: 'bar' | 'stars' | 'both';
  maxStars?: 5 | 10;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'both',
  maxStars = 10,
  size = 'md',
  showPercentage = true,
  className = '',
  label = 'نسبة الإنجاز',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));
  const filledStars = Math.round((clampedProgress / 100) * maxStars);

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-[#174235] dark:bg-emerald-500';
    if (pct >= 60) return 'bg-[#1f5645] dark:bg-emerald-600';
    if (pct >= 30) return 'bg-[#317862] dark:bg-teal-600';
    return 'bg-[#7aa696] dark:bg-emerald-800';
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${clampedProgress}%`}
      className={`space-y-1 ${className}`}
    >
      {(variant === 'stars' || variant === 'both') && (
        <div className="flex items-center gap-0.5" title={`${label}: ${clampedProgress}%`}>
          {Array.from({ length: maxStars }).map((_, i) => (
            <span
              key={i}
              className={`inline-block transition-colors text-xs ${
                i < filledStars
                  ? 'text-amber-500 dark:text-amber-400 font-bold'
                  : 'text-[#d8d5cd] dark:text-[#32453a]'
              }`}
              aria-hidden="true"
            >
              ★
            </span>
          ))}
          {showPercentage && (
            <span className={`font-mono tabular-nums font-bold ml-1.5 text-[#174235] dark:text-emerald-400 ${textSize}`}>
              {clampedProgress}%
            </span>
          )}
        </div>
      )}

      {(variant === 'bar' || variant === 'both') && (
        <div className={`w-full bg-[#ebe8e1] dark:bg-[#203027] rounded-full overflow-hidden ${barHeight}`}>
          <div
            className={`${getBarColor(clampedProgress)} ${barHeight} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
