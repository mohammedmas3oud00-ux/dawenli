import { CustomFieldDefinition } from '../types/hierarchical';

const STORAGE_KEY_PREFIX = 'dawenli_custom_fields_';

const DEFAULT_TASK_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf_task_difficulty',
    name: 'مستوى الصعوبة',
    type: 'select',
    options: ['سهل', 'متوسط', 'مرتفع', 'معقد'],
    entityType: 'task',
  },
  {
    id: 'cf_task_context',
    name: 'السياق',
    type: 'text',
    entityType: 'task',
  },
];

const DEFAULT_PROJECT_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf_proj_budget',
    name: 'الميزانية التقديرية',
    type: 'number',
    entityType: 'project',
  },
  {
    id: 'cf_proj_client',
    name: 'الجهة / الشريك',
    type: 'text',
    entityType: 'project',
  },
  {
    id: 'cf_proj_priority_tier',
    name: 'تصنيف الأهمية',
    type: 'select',
    options: ['استراتيجي عالي', 'أساسي', 'تطويري ثانوني'],
    entityType: 'project',
  },
];

export function getCustomFields(entityType: 'task' | 'project'): CustomFieldDefinition[] {
  if (typeof window === 'undefined') {
    return entityType === 'task' ? DEFAULT_TASK_FIELDS : DEFAULT_PROJECT_FIELDS;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${entityType}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`Failed to parse custom fields for ${entityType}:`, e);
  }
  const defaults = entityType === 'task' ? DEFAULT_TASK_FIELDS : DEFAULT_PROJECT_FIELDS;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${entityType}`, JSON.stringify(defaults));
  return defaults;
}

export function saveCustomFields(entityType: 'task' | 'project', fields: CustomFieldDefinition[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${entityType}`, JSON.stringify(fields));
  } catch (e) {
    console.error(`Failed to save custom fields for ${entityType}:`, e);
  }
}

export function addCustomField(
  entityType: 'task' | 'project',
  field: Omit<CustomFieldDefinition, 'id' | 'entityType'>
): CustomFieldDefinition {
  const current = getCustomFields(entityType);
  const newField: CustomFieldDefinition = {
    ...field,
    id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    entityType,
  };
  const updated = [...current, newField];
  saveCustomFields(entityType, updated);
  return newField;
}

export function deleteCustomField(entityType: 'task' | 'project', fieldId: string): void {
  const current = getCustomFields(entityType);
  const updated = current.filter((f) => f.id !== fieldId);
  saveCustomFields(entityType, updated);
}
