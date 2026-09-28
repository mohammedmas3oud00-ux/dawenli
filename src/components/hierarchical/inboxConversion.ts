export type InboxConversionTarget = 'task' | 'project' | 'vault' | 'habit' | 'calendar';

type InboxConversionParents = {
  hasProjects: boolean;
  hasGoals: boolean;
  hasPillars: boolean;
};

export function getInboxConversionBlockReason(
  target: InboxConversionTarget,
  parents: InboxConversionParents,
): string | null {
  if (target === 'task' && !parents.hasProjects) return 'أنشئ مشروعًا أولًا حتى يمكن إضافة المهمة تحته.';
  if (target === 'project' && !parents.hasGoals) return 'أنشئ هدف قيمة أولًا حتى يمكن تأسيس المشروع تحته.';
  if ((target === 'vault' || target === 'habit') && !parents.hasPillars)
    return 'أنشئ ركيزة أولًا حتى يمكن ربط العنصر بها.';
  return null;
}
