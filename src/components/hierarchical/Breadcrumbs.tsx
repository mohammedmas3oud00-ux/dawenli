import React from 'react';
import { ChevronLeft, Layers, Target, Folder, Eye } from 'lucide-react';
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
        return <span className="text-xs">🏛️</span>;
      case 'vision':
        return <Eye className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
      case 'goal':
        return <Target className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
      case 'project':
        return <Folder className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />;
    }
  };

  return (
    <nav className="flex items-center gap-1 py-1 px-1.5 text-xs text-[#5c6861] dark:text-slate-400 overflow-x-auto no-scrollbar">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronLeft className="w-3.5 h-3.5 text-[#b5beba] dark:text-slate-600 shrink-0" />
            )}
            <button
              onClick={() => onNavigate(item)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                isLast
                  ? 'font-bold text-[#1a2420] dark:text-slate-100 cursor-default'
                  : 'text-[#65736b] dark:text-slate-400 hover:text-[#174235] dark:hover:text-emerald-300 hover:bg-[#f6f5f1] dark:hover:bg-slate-800 cursor-pointer'
              }`}
            >
              {getIcon(item.type)}
              <span>{item.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
