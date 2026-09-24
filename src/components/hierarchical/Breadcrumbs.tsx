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
        return <Layers className="w-3.5 h-3.5 text-[#174235]" />;
      case 'pillar':
        return <span className="text-xs">🏛️</span>;
      case 'vision':
        return <Eye className="w-3.5 h-3.5 text-[#174235]" />;
      case 'goal':
        return <Target className="w-3.5 h-3.5 text-[#174235]" />;
      case 'project':
        return <Folder className="w-3.5 h-3.5 text-[#174235]" />;
    }
  };

  return (
    <nav className="flex items-center gap-1 py-1 px-1.5 text-xs text-[#5c6861] overflow-x-auto">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronLeft className="w-3.5 h-3.5 text-[#b5beba] shrink-0" />
            )}
            <button
              onClick={() => onNavigate(item)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                isLast
                  ? 'font-semibold text-[#1a2420] cursor-default'
                  : 'text-[#65736b] hover:text-[#174235] hover:bg-[#f6f5f1] cursor-pointer'
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
