import React, { useState } from 'react';
import { Database, Copy, Check } from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sqlCode = `-- Dawenli schema v3
-- The canonical, rerunnable Supabase migration is:
-- supabase/migrations/202609240001_harden_dawenli.sql

-- Apply with the Supabase CLI:
--   supabase db push

-- The migration creates the complete hierarchy and supporting tables,
-- enables RLS for authenticated users, enforces user-owned relationships,
-- and installs BEFORE/AFTER rollup and time-block overlap triggers.
-- It is intentionally non-destructive and safe to run against an existing
-- Dawenli database. Review the migration before applying it in production.
`;

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-slate-100 rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in fade-in">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ebf4f0]/20 text-[#34d399] flex items-center justify-center border border-[#34d399]/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Supabase / PostgreSQL Schema</h3>
              <p className="text-[11px] text-slate-400">المخطط القابل لإعادة التشغيل وسياسات RLS والترحيلات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              aria-label="نسخ تعليمات مخطط قاعدة البيانات"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174235] hover:bg-[#1f5645] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#2d735d]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ بنجاح' : 'نسخ التعليمات'}</span>
            </button>
            <button onClick={onClose} aria-label="إغلاق" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 bg-slate-950 leading-relaxed selection:bg-indigo-600 selection:text-white">
          <pre>{sqlCode}</pre>
        </div>

        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>الملف canonical: /supabase/migrations/202609240001_harden_dawenli.sql</span>
          <button onClick={onClose} className="px-3 py-1 text-slate-300 hover:text-white rounded">إغلاق</button>
        </div>
      </div>
    </div>
  );
};
