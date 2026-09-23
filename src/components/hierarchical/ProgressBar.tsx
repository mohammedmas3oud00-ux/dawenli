import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: 'bar' | 'stars' | 'both';
  maxStars?: 5 | 10;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'both',
  maxStars = 10,
  size = 'md',
  showPercentage = true,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));
  const filledStars = Math.round((clampedProgress / 100) * maxStars);

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-[#174235]';
    if (pct >= 60) return 'bg-[#1f5645]';
    if (pct >= 30) return 'bg-[#317862]';
    return 'bg-[#7aa696]';
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {(variant === 'stars' || variant === 'both') && (
        <div className="flex items-center gap-0.5" title={`${clampedProgress}% (${filledStars}/${maxStars} نجوم)`}>
          {Array.from({ length: maxStars }).map((_, i) => (
            <span
              key={i}
              className={`inline-block transition-colors text-xs ${
                i < filledStars
                  ? 'text-[#c29329] font-bold'
                  : 'text-[#d8d5cd]'
              }`}
            >
              ★
            </span>
          ))}
          {showPercentage && (
            <span className={`font-mono font-bold ml-1.5 text-[#174235] ${textSize}`}>
              {clampedProgress}%
            </span>
          )}
        </div>
      )}

      {(variant === 'bar' || variant === 'both') && (
        <div className={`w-full bg-[#ebe8e1] rounded-full overflow-hidden ${barHeight}`}>
          <div
            className={`${getBarColor(clampedProgress)} ${barHeight} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};
