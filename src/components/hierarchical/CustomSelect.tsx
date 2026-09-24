import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  align?: 'right' | 'left';
  size?: 'xs' | 'sm' | 'md';
  disabled?: boolean;
  prefixIcon?: React.ReactNode;
  title?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  align = 'right',
  size = 'sm',
  disabled = false,
  prefixIcon,
  title,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    xs: 'px-2 py-1 text-[11px] rounded-lg gap-1.5',
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-2',
    md: 'px-3 py-2 text-xs rounded-xl gap-2.5',
  }[size];

  const handleSelect = (optValue: T) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-right ${className}`} title={title}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border bg-white dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 transition-all cursor-pointer select-none font-medium ${
          isOpen
            ? 'border-[#174235] dark:border-emerald-500 ring-2 ring-[#174235]/15 dark:ring-emerald-500/20 shadow-xs'
            : 'border-[#d8d4cc] dark:border-slate-700 hover:border-[#174235]/60 dark:hover:border-emerald-500 hover:bg-[#faf9f6] dark:hover:bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-[#f3f2ee] dark:bg-slate-800' : ''} ${sizeClasses} ${buttonClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          {prefixIcon && <span className="shrink-0 text-[#78857e] dark:text-slate-400">{prefixIcon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#78857e] dark:text-slate-400 shrink-0 transition-transform duration-150 mr-1.5 ${
            isOpen ? 'rotate-180 text-[#174235] dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 min-w-full w-max max-w-xs bg-white dark:bg-slate-800 border border-[#e2ddd3] dark:border-slate-700 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${dropdownClassName}`}
          style={{ maxHeight: '280px' }}
        >
          <div className="max-h-64 overflow-y-auto divide-y divide-[#f5f3ee]/80 dark:divide-slate-700/80 overscroll-contain no-scrollbar">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#85928a] dark:text-slate-400 text-center">لا توجد خيارات</div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-right text-xs transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 font-semibold'
                        : 'text-[#35403a] dark:text-slate-200 hover:bg-[#f8f7f3] dark:hover:bg-slate-700/60 hover:text-[#1a2420] dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <div className="truncate">
                        <div className="truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-[10px] text-[#7d8982] dark:text-slate-400 font-normal truncate mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400 shrink-0 mr-2 stroke-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
