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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131d18] p-5 rounded-2xl border border-[#e8e5de] dark:border-[#26372d] shadow-2xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1a2420] dark:text-white">الرؤى المستقبلية (Visions)</h1>
            <p className="text-xs text-[#636e67] dark:text-[#9bb0a3]">
              الآفاق والصور الكبرى المنشودة، موزعة ومربوطة بمجالات الحياة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pillar Filter */}
          <CustomSelect
            value={selectedPillarFilter}
            onChange={(val) => setSelectedPillarFilter(val)}
            options={[
              { value: 'all', label: `كل المجالات (${visions.length})` },
              ...pillars.map((p) => ({ value: p.id, label: p.title })),
            ]}
            prefixIcon={<Filter className="w-3.5 h-3.5 text-[#7d8982] dark:text-[#8ea095]" />}
            size="xs"
            buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] dark:bg-[#192620] border-[#e3dfd7] dark:border-[#283830]"
          />

          <button
            type="button"
            onClick={onNewVision}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>رؤية جديدة</span>
          </button>
        </div>
      </div>

      {/* Grid of Visions */}
      {filteredVisions.length === 0 ? (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-12 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
          لا توجد رؤى مطابقة في الوقت الحالي. يمكنك إنشاء رؤية جديدة وربطها بالمجال المناسب.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisions.map((vision) => {
            const parentPillar = getPillar(vision.pillar_id);
            return (
              <div
                key={vision.id}
                className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    {parentPillar ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] truncate max-w-[170px]">
                        🏛️ {parentPillar.title}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#7d8982] dark:text-[#8ea095]">عام</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditVision(vision)}
                        className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded cursor-pointer"
                        title="تعديل الرؤية"
                        aria-label="تعديل الرؤية"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteVision(vision.id)}
                        className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                        title="حذف الرؤية"
                        aria-label="حذف الرؤية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onSelectVision(vision.id, vision.pillar_id)}
                      className="font-bold text-sm text-[#1a2420] dark:text-white group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {vision.title}
                    </h3>
                    {vision.description && (
                      <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] mt-1 line-clamp-3 leading-relaxed">
                        {vision.description}
                      </p>
                    )}
                  </div>

                  {vision.timeframe && (
                    <div className="flex items-center gap-1 text-[11px] text-[#174235] dark:text-emerald-400 font-mono font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#7da897] dark:text-emerald-500" />
                      <span>الأفق: {vision.timeframe}</span>
                    </div>
                  )}
                </div>

                {/* Progress rollup */}
                <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078] dark:text-[#8ea095]">نسبة التقدم المحسوبة:</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{vision.progress}%</span>
                  </div>
                  <ProgressBar progress={vision.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    type="button"
                    onClick={() => onSelectVision(vision.id, vision.pillar_id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-[#1a2620] hover:bg-[#ebf4f0] dark:hover:bg-[#22332a] text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-[#283830] group-hover:border-[#cfe3d9] dark:group-hover:border-[#335544] cursor-pointer"
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
