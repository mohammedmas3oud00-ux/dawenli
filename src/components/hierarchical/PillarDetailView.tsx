import React from 'react';
import { Plus, Edit2, Trash2, Eye, ChevronLeft, Quote, Clock, Activity } from 'lucide-react';
import { Pillar, Vision } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';

interface PillarDetailViewProps {
  pillar: Pillar;
  visions: Vision[];
  onSelectVision: (visionId: string) => void;
  onNewVision: () => void;
  onEditVision: (vision: Vision) => void;
  onDeleteVision: (visionId: string) => void;
  onEditPillar: (pillar: Pillar) => void;
  onStartPillarReview?: (pillarId: string) => void;
}

export const PillarDetailView: React.FC<PillarDetailViewProps> = ({
  pillar,
  visions,
  onSelectVision,
  onNewVision,
  onEditVision,
  onDeleteVision,
  onEditPillar,
  onStartPillarReview,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Pillar Header Card */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] dark:border-[#223028] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] flex items-center justify-center text-lg font-bold">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1a2420] dark:text-white tracking-tight">{pillar.title}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]">
                  {pillar.pillar_group} · أولوية #{pillar.priority}
                </span>
              </div>
              {pillar.description && (
                <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] mt-0.5">{pillar.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onStartPillarReview && (
              <button
                type="button"
                onClick={() => onStartPillarReview(pillar.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ebf4f0] dark:bg-[#192b22] hover:bg-[#d8ece2] dark:hover:bg-[#203a2c] text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold cursor-pointer border border-[#cfe3d9] dark:border-[#264434] transition-colors"
                title="بدء مراجعة تأملية وتشخيص آلي خاص بهذا المجال"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>مراجعة المجال</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onEditPillar(pillar)}
              className="px-3 py-1.5 bg-[#f6f5f1] dark:bg-[#1a2620] hover:bg-[#ede9e1] dark:hover:bg-[#22332a] text-[#3f4b44] dark:text-[#c4d6cb] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8] dark:border-[#283830] transition-colors"
            >
              تعديل المجال
            </button>
            <button
              type="button"
              onClick={onNewVision}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة رؤية</span>
            </button>
          </div>
        </div>

        {/* The Pillar's Big Why (Purpose) */}
        <div className="bg-[#faf8f4] dark:bg-[#1a251f] rounded-xl p-4 sm:p-5 border border-[#ece6db] dark:border-[#28382e] relative">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-[#b08726] dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#8a6519] dark:text-amber-400 tracking-wider uppercase">
                الغاية الكبرى والبوصلة التوجيهية (The Big Why):
              </span>
              <p className="text-sm sm:text-base font-medium text-[#2d281f] dark:text-[#e2eee7] leading-relaxed">
                «{pillar.purpose || 'لم يتم تحديد الغاية بعد.'}»
              </p>
              <span className="text-[10px] text-[#827a6f] dark:text-[#8ea095] block pt-0.5">
                تحدد هذه الغاية المقصد الأسمى، وتتفرع منها الرؤى المستقبلية والأهداف التنفيذية.
              </span>
            </div>
          </div>
        </div>

        {/* Pillar Progress Overview Bar */}
        <div className="bg-[#f8f7f4] dark:bg-[#15211a] p-3 rounded-xl border border-[#ece8e0] dark:border-[#223228] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#647169] dark:text-[#9bb0a3] font-medium">التقدم الإجمالي للمجال (محسوب تصاعدياً):</span>
            <span className="font-mono font-bold text-[#174235] dark:text-emerald-400 text-sm">{pillar.progress}%</span>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar progress={pillar.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Visions List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1a2420] dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
            <span>الرؤى المستقبلية التابعة لهذا المجال</span>
          </h2>
          <p className="text-[11px] text-[#6d7972] dark:text-[#9bb0a3]">
            الرؤية تمثل الصورة المستقبلية والأفق المنشود. انقر على أي رؤية للتعمق في أهدافها التابعة.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewVision}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>رؤية جديدة</span>
        </button>
      </div>

      {/* Visions Cards */}
      {visions.length === 0 ? (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-8 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3] space-y-3">
          <p>لا توجد رؤى مسجلة تحت هذا المجال حتى الآن.</p>
          <button
            type="button"
            onClick={onNewVision}
            className="px-4 py-2 bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 font-bold rounded-xl border border-[#cfe3d9] dark:border-[#264434] hover:bg-[#d8ece2] dark:hover:bg-[#203a2c] cursor-pointer transition-colors"
          >
            + صياغة أول رؤية لهذا المجال
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visions.map((vision) => (
            <div
              key={vision.id}
              className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]">
                    👁️ رؤية استراتيجية
                  </span>

                  <div className="flex items-center gap-1">
                    {vision.timeframe && (
                      <span className="text-[10px] text-[#78857e] dark:text-[#8ea095] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{vision.timeframe}</span>
                      </span>
                    )}
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
                    onClick={() => onSelectVision(vision.id)}
                    className="font-bold text-sm text-[#1a2420] dark:text-white group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {vision.title}
                  </h3>
                  {vision.description && (
                    <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] mt-1 line-clamp-2 leading-relaxed">
                      {vision.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress and drill-down button */}
              <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#738078] dark:text-[#8ea095]">نسبة الإنجاز (من أهدافها):</span>
                  <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{vision.progress}%</span>
                </div>
                <ProgressBar progress={vision.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                <button
                  type="button"
                  onClick={() => onSelectVision(vision.id)}
                  className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-[#1a2620] hover:bg-[#ebf4f0] dark:hover:bg-[#22332a] text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-[#283830] group-hover:border-[#cfe3d9] dark:group-hover:border-[#335544] cursor-pointer"
                >
                  <span>استعراض الأهداف الاستراتيجية</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
