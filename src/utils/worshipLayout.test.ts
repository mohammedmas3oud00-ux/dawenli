import { describe, expect, it } from 'vitest';
import type { WorshipDefinition } from '../types/hierarchical';
import { sortWorshipDefinitions, worshipSections } from './worshipLayout';

describe('worship layout', () => {
  it('orders prayers chronologically without changing stored records', () => {
    const input = ['العشاء', 'العصر', 'الفجر', 'المغرب', 'الظهر'].map((title, i) => ({ id: String(i), title, sort_order: i } as WorshipDefinition));
    expect(sortWorshipDefinitions(input).map((item) => item.title)).toEqual(['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء']);
    expect(input[0].title).toBe('العشاء');
  });
  it('keeps obligatory prayers separate from sunnah tracking', () => {
    expect(worshipSections[0].category).toBe('salah');
    expect(worshipSections[1].category).toBe('sunnah_rawatib');
    expect(new Set(worshipSections.map((s) => s.category)).size).toBe(9);
  });
});
