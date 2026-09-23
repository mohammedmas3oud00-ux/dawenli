import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

const COLOR_PALETTES = [
  'bg-indigo-600 text-white',
  'bg-emerald-600 text-white',
  'bg-blue-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-violet-600 text-white',
  'bg-teal-600 text-white',
  'bg-sky-600 text-white',
];

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatar,
  size = 'sm',
  className = '',
  title,
}) => {
  const [imgError, setImgError] = useState(false);

  // Derive stable color from name
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];

  // Derive 1-2 initials in Arabic
  const parts = (name || '').trim().split(/\s+/);
  const initials = parts.length > 1
    ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`
    : (name || '').slice(0, 2);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-10 h-10 text-sm font-bold',
  };

  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt={name}
        title={title || name}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 ring-1 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      title={title || name}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shrink-0 select-none ring-1 ring-white ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
};
