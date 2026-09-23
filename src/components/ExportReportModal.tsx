import React from 'react';
import { X, Printer, Download, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Project, Task } from '../types';
import { calculateProjectProgress, calculateWorkspaceStats } from '../utils/progressCalculator';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
}) => {
  if (!isOpen) return null;

  const workspaceStats = calculateWorkspaceStats(projects, tasks);
  const nowStr = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'المشروع,التصنيف,الأولوية,نسبة الإنجاز,طريقة الحساب,المهام المكتملة,إجمالي المهام,ساعات العمل,الموعد النهائي,الحالة\n';

    projects.forEach((p) => {
      const s = calculateProjectProgress(p, tasks);
      const row = [
        `"${p.name}"`,
        `"${p.category}"`,
        `"${p.priority}"`,
        `"${s.percentage}%"`,
        `"${p.calculationMode}"`,
        `"${s.completedTasks}"`,
        `"${s.totalTasks}"`,
        `"${s.loggedHours}/${s.totalEstimatedHours}"`,
        `"${p.dueDate}"`,
        `"${s.health}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_إنجاز_المشاريع_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full shadow-2xl border border-slate-200 my-8">
        
        {/* Actions bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-indigo-600">
            <FileText className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900">
              تقرير الإنجاز وحساب التقدم التنفيذي
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة التقرير</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="text-xs space-y-6 text-slate-800" id="printable-report">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold text-slate-900 mb-1">
                  تقرير متابعة المشاريع ونسب التقدم
                </h1>
                <p className="text-slate-500">
                  منظومة إنجاز لإدارة المشاريع والمهام المحسوبة
                </p>
              </div>
              <div className="text-left font-mono text-slate-500">
                <div>تاريخ التقرير: {nowStr}</div>
                <div>إجمالي المشاريع: {workspaceStats.totalProjects}</div>
              </div>
            </div>
          </div>

          {/* Workspace summary metrics */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-500 block mb-0.5">متوسط تقدم المشاريع:</span>
              <span className="text-xl font-bold font-mono text-emerald-600">
                {workspaceStats.averageProjectProgress}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">المهام المكتملة:</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {workspaceStats.completedTasks} / {workspaceStats.totalTasks}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">ساعات العمل الفعلية:</span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {workspaceStats.totalLoggedHours} س
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">المهام المتأخرة:</span>
              <span className={`text-xl font-bold font-mono ${workspaceStats.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {workspaceStats.overdueTasks}
              </span>
            </div>
          </div>

          {/* Detailed Projects Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-2">
              جدول تقدم المشاريع المفصل:
            </h3>
            <table className="w-full border border-slate-200 divide-y divide-slate-200 text-right">
              <thead className="bg-slate-100 font-semibold text-slate-600">
                <tr>
                  <th className="p-2">المشروع</th>
                  <th className="p-2">التصنيف</th>
                  <th className="p-2 text-center">نسبة التقدم</th>
                  <th className="p-2 text-center">المهام</th>
                  <th className="p-2 text-center">ساعات العمل</th>
                  <th className="p-2">الموعد النهائي</th>
                  <th className="p-2">المسار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => {
                  const s = calculateProjectProgress(p, tasks);
                  return (
                    <tr key={p.id}>
                      <td className="p-2 font-semibold text-slate-900">{p.name}</td>
                      <td className="p-2 text-slate-600">{p.category}</td>
                      <td className="p-2 text-center font-bold font-mono text-indigo-600">
                        {s.percentage}%
                      </td>
                      <td className="p-2 text-center font-mono">
                        {s.completedTasks} / {s.totalTasks}
                      </td>
                      <td className="p-2 text-center font-mono">
                        {s.loggedHours} / {s.totalEstimatedHours} س
                      </td>
                      <td className="p-2 font-mono text-slate-600">{p.dueDate}</td>
                      <td className="p-2">
                        {s.health === 'completed' && <span className="text-emerald-600 font-medium">مكتمل</span>}
                        {s.health === 'delayed' && <span className="text-rose-600 font-medium">متأخر</span>}
                        {s.health === 'at_risk' && <span className="text-amber-600 font-medium">خطر</span>}
                        {s.health === 'on_track' && <span className="text-emerald-600 font-medium">منضبط</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Overdue Tasks Alert if any */}
          {workspaceStats.overdueTasks > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>تنبيه المخاطر: توجد مهام تجاوزت الموعد النهائي تتطلب إعادة جدولة</span>
              </div>
              <p className="text-amber-700">
                يرجى مراجعة المهام المعلقة والتحقق من إعادة توزيع الموارد لتفادي تعثر مواعيد تسليم المشاريع.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-6 border-t border-slate-100 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
