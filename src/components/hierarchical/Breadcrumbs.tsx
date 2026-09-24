import React from 'react';
import { ChevronLeft, Layers, Target, Folder, Compass } from 'lucide-react';
import { BreadcrumbItem } from '../../types/hierarchical';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  const getIcon = (type: BreadcrumbItem['type']) => {
    switch (type) {
      case 'root':
        return <Layers className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
      case 'pillar':
        return <span className="text-xs" aria-hidden="true">🌱</span>;
      case 'vision':
        return <Compass className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
      case 'goal':
        return <Target className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
      case 'project':
        return <Folder className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
    }
  };

  return (
    <nav
      aria-label="مسار التصفح الهرمي"
      className="flex items-center gap-1 py-1 px-1 text-xs text-[#5c6861] dark:text-[#9bb0a3] overflow-x-auto scrollbar-none"
    >
      <ol className="flex items-center gap-1 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id} className="flex items-center gap-1 shrink-0">
              {index > 0 && (
                <ChevronLeft className="w-3.5 h-3.5 text-[#b5beba] dark:text-[#415349] shrink-0" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => onNavigate(item)}
                disabled={isLast}
                aria-current={isLast ? 'location' : undefined}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                  isLast
                    ? 'font-bold text-[#1a2420] dark:text-white cursor-default bg-[#f2efe8]/60 dark:bg-[#1a2620]'
                    : 'text-[#5c6861] dark:text-[#9bb0a3] hover:text-[#174235] dark:hover:text-emerald-300 hover:bg-[#f6f5f1] dark:hover:bg-[#1c2a22] cursor-pointer'
                }`}
              >
                {getIcon(item.type)}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
