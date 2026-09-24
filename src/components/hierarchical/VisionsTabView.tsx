import React, { useState } from 'react';
import { Eye, Plus, Edit2, Trash2, ChevronLeft, Clock, Filter } from 'lucide-react';
import { Vision, Pillar } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { CustomSelect } from './CustomSelect';

interface VisionsTabViewProps {
  visions: Vision[];
  pillars: Pillar[];
  onSelectVision: (visionId: string, pillarId: string) => void;
  onNewVision: () => void;
  onEditVision: (vision: Vision) => void;
  onDeleteVision: (visionId: string) => void;
}

export const VisionsTabView: React.FC<VisionsTabViewProps> = ({
  visions,
  pillars,
  onSelectVision,
  onNewVision,
  onEditVision,
  onDeleteVision,
}) => {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');

  const filteredVisions = visions.filter((v) => {
    if (selectedPillarFilter === 'all') return true;
    return v.pillar_id === selectedPillarFilter;
  });

  const getPillar = (pillarId: string) => pillars.find((p) => p.id === pillarId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e8e5de] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#1a2420]">الرؤى المستقبلية</h1>
            <p className="text-xs text-[#636e67]">
              الآفاق والصور الكبرى المنشودة، موزعة ومربوطة بالركائز الأساسية للحياة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pillar Filter */}
          <CustomSelect
            value={selectedPillarFilter}
            onChange={(val) => setSelectedPillarFilter(val)}
            options={[
              { value: 'all', label: `كل الركائز (${visions.length})` },
              ...pillars.map((p) => ({ value: p.id, label: p.title })),
            ]}
            prefixIcon={<Filter className="w-3.5 h-3.5 text-[#7d8982]" />}
            size="xs"
            buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] border-[#e3dfd7]"
          />

          <button
            onClick={onNewVision}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>رؤية جديدة</span>
          </button>
        </div>
      </div>

      {/* Grid of Visions */}
      {filteredVisions.length === 0 ? (
        <div className="bg-white border border-[#e8e5de] rounded-2xl p-12 text-center text-xs text-[#7d8982]">
          لا توجد رؤى مطابقة في الوقت الحالي. يمكنك إنشاء رؤية جديدة وربطها بالركيزة المناسبة.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisions.map((vision) => {
            const parentPillar = getPillar(vision.pillar_id);
            return (
              <div
                key={vision.id}
                className="bg-white border border-[#e8e5de] hover:border-[#174235]/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    {parentPillar ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] truncate max-w-[170px]">
                        🏛️ {parentPillar.title}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#7d8982]">عام</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditVision(vision)}
                        className="p-1 text-[#838f87] hover:text-[#1a2420] rounded cursor-pointer"
                        title="تعديل الرؤية"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteVision(vision.id)}
                        className="p-1 text-[#838f87] hover:text-rose-600 rounded cursor-pointer"
                        title="حذف الرؤية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onSelectVision(vision.id, vision.pillar_id)}
                      className="font-bold text-sm text-[#1a2420] group-hover:text-[#174235] transition-colors cursor-pointer"
                    >
                      {vision.title}
                    </h3>
                    {vision.description && (
                      <p className="text-xs text-[#636e67] mt-1 line-clamp-3 leading-relaxed">
                        {vision.description}
                      </p>
                    )}
                  </div>

                  {vision.timeframe && (
                    <div className="flex items-center gap-1 text-[11px] text-[#174235] font-mono font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#7da897]" />
                      <span>الأفق: {vision.timeframe}</span>
                    </div>
                  )}
                </div>

                {/* Progress rollup */}
                <div className="pt-3 border-t border-[#f0eee9] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078]">نسبة التقدم المحسوبة:</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235]">{vision.progress}%</span>
                  </div>
                  <ProgressBar progress={vision.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    onClick={() => onSelectVision(vision.id, vision.pillar_id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] hover:bg-[#ebf4f0] text-[#174235] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] group-hover:border-[#cfe3d9] cursor-pointer"
                  >
                    <span>الدخول وتصفح الأهداف</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
