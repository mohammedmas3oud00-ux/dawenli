import { describe, expect, it } from 'vitest';
import { getInboxConversionBlockReason } from './inboxConversion';

describe('inbox conversion guards', () => {
  it('blocks task conversion without a project', () => {
    expect(
      getInboxConversionBlockReason('task', { hasProjects: false, hasGoals: true, hasPillars: true }),
    ).toBeTruthy();
  });

  it('allows calendar and valid parent conversions', () => {
    expect(
      getInboxConversionBlockReason('calendar', { hasProjects: false, hasGoals: false, hasPillars: false }),
    ).toBeNull();
    expect(
      getInboxConversionBlockReason('vault', { hasProjects: false, hasGoals: false, hasPillars: true }),
    ).toBeNull();
  });

  it('blocks project conversion without a goal', () => {
    expect(getInboxConversionBlockReason('project', { hasProjects: true, hasGoals: false, hasPillars: true })).toBe(
      'أنشئ هدف قيمة أولًا حتى يمكن تأسيس المشروع تحته.',
    );
  });

  it('blocks vault and habit conversion without a pillar', () => {
    expect(getInboxConversionBlockReason('habit', { hasProjects: true, hasGoals: true, hasPillars: false })).toBe(
      'أنشئ ركيزة أولًا حتى يمكن ربط العنصر بها.',
    );
    expect(getInboxConversionBlockReason('vault', { hasProjects: true, hasGoals: true, hasPillars: false })).toBe(
      'أنشئ ركيزة أولًا حتى يمكن ربط العنصر بها.',
    );
  });

  it('permits every target when all parents exist', () => {
    const parents = { hasProjects: true, hasGoals: true, hasPillars: true };
    expect(['task', 'project', 'vault', 'habit', 'calendar'].every((target) => !getInboxConversionBlockReason(target as never, parents))).toBe(true);
  });
});
