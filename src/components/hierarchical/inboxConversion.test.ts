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
});
