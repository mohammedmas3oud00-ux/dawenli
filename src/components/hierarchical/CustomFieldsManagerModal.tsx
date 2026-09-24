import React, { useState } from 'react';
import { Settings, Plus, Trash2, X, Sliders, Type, Hash, ListFilter, Calendar, CheckSquare } from 'lucide-react';
import { CustomFieldDefinition, CustomFieldType } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';
import { createId } from '../../utils/id';

interface CustomFieldsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'task' | 'project';
  fields: CustomFieldDefinition[];
  onFieldsChanged: (updatedFields: CustomFieldDefinition[]) => void;
}

export const CustomFieldsManagerModal: React.FC<CustomFieldsManagerModalProps> = ({
  isOpen,
  onClose,
  entityType,
  fields,
  onFieldsChanged,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [optionsStr, setOptionsStr] = useState('');

  if (!isOpen) return null;

  const entityTitle = entityType === 'task' ? 'المهام' : 'المشاريع';

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let options: string[] | undefined = undefined;
    if (type === 'select') {
      options = optionsStr
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length === 0) {
        options = ['خيار 1', 'خيار 2'];
      }
    }

    const created: CustomFieldDefinition = {
      id: createId(),
      entityType,
      name: name.trim(),
      type,
      options,
    };

    onFieldsChanged([...fields, created]);
    setName('');
    setType('text');
    setOptionsStr('');
  };

  const handleDelete = (id: string) => {
    onFieldsChanged(fields.filter((f) => f.id !== id));
  };

  const getTypeIcon = (t: CustomFieldType) => {
    switch (t) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'select':
        return <ListFilter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
  };

  const getTypeName = (t: CustomFieldType) => {
    switch (t) {
      case 'text':
        return 'نص';
      case 'number':
        return 'رقم';
      case 'select':
        return 'قائمة اختيار';
      case 'date':
        return 'تاريخ';
      case 'checkbox':
        return 'مربع اختيار';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-[#e8e5de] dark:border-slate-800 overflow-hidden text-xs animate-in fade-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#f0eee9] dark:border-slate-800 flex items-center justify-between bg-[#fbfbfa] dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ebf4f0] dark:bg-emerald-950 text-[#174235] dark:text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1a2420] dark:text-slate-100">
                إدارة الحقول والخصائص المخصصة ({entityTitle})
              </h3>
              <p className="text-[11px] text-[#6d7972] dark:text-slate-400">
                مرونة شبيهة بـ Notion: أضف خصائص مخصصة لعناصرك ديناميكياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#85918a] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 text-sm p-1 rounded-lg hover:bg-[#f2efe9] dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Current Fields List */}
          <div>
            <h4 className="font-bold text-[#2a352f] dark:text-slate-200 mb-2 flex items-center justify-between">
              <span>الخصائص المخصصة الحالية</span>
              <span className="text-[10px] text-[#7a8880] dark:text-slate-400 font-mono">({fields.length})</span>
            </h4>

            {fields.length === 0 ? (
              <p className="text-center py-4 text-[#8a9890] dark:text-slate-500 bg-[#faf9f6] dark:bg-slate-800/50 rounded-xl border border-dashed border-[#e2ddd5] dark:border-slate-700">
                لا توجد خصائص مخصصة حالياً. أضف خاصية جديدة بالأسفل.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#e8e4db] dark:border-slate-800 bg-[#fdfcfb] dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-md bg-white dark:bg-slate-700 border border-[#e8e4db] dark:border-slate-600">
                        {getTypeIcon(field.type)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-[#1a2420] dark:text-slate-100 block truncate">
                          {field.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#78857e] dark:text-slate-400">
                          <span>النوع: {getTypeName(field.type)}</span>
                          {field.options && field.options.length > 0 && (
                            <span className="truncate max-w-[200px]">
                              الخيارات: ({field.options.join('، ')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(field.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                      title="حذف الخاصية"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Field Form */}
          <form onSubmit={handleAddField} className="pt-4 border-t border-[#f0ede6] dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-[#2a352f] dark:text-slate-200">إضافة خاصية جديدة</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4a5850] dark:text-slate-300 mb-1">
                  اسم الخاصية: *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الميزانية، جهة الاتصال..."
                  className="w-full p-2 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4a5850] dark:text-slate-300 mb-1">
                  نوع الخاصية:
                </label>
                <CustomSelect
                  value={type}
                  onChange={(val) => setType(val as CustomFieldType)}
                  options={[
                    { value: 'text', label: 'نص', icon: <Type className="w-3 h-3 text-blue-500" /> },
                    { value: 'number', label: 'رقم', icon: <Hash className="w-3 h-3 text-emerald-500" /> },
                    { value: 'select', label: 'قائمة اختيار', icon: <ListFilter className="w-3 h-3 text-purple-500" /> },
                    { value: 'date', label: 'تاريخ', icon: <Calendar className="w-3 h-3 text-amber-500" /> },
                    { value: 'checkbox', label: 'مربع اختيار', icon: <CheckSquare className="w-3 h-3 text-rose-500" /> },
                  ]}
                  className="w-full"
                  buttonClassName="w-full bg-[#faf8f5] dark:bg-slate-800 border-[#d8d4cc] dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            {type === 'select' && (
              <div>
                <label className="block text-[11px] font-bold text-[#4a5850] dark:text-slate-300 mb-1">
                  خيارات القائمة (افصل بينها بفواصل):
                </label>
                <input
                  type="text"
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="مثال: مرحلة أولى، مرحلة ثانية، قيد الاعتماد"
                  className="w-full p-2 bg-[#faf8f5] dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 text-xs"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة الخاصية</span>
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#fbfbfa] dark:bg-slate-800/80 border-t border-[#f0eee9] dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-[#d8d4cc] dark:border-slate-700 hover:bg-[#f6f5f1] dark:hover:bg-slate-700 text-[#2c3731] dark:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
