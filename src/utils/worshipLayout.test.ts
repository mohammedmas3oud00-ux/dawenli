import { describe, expect, it } from 'vitest';
import type { WorshipDefinition } from '../types/hierarchical';
import { sortWorshipDefinitions, worshipSections } from './worshipLayout';

describe('worship layout', () => {
  it('orders prayers chronologically without changing stored records', () => {
    const input = ['العشاء', 'العصر', 'الفجر', 'المغرب', 'الظهر'].map(
      (title, i) => ({ id: String(i), title, sort_order: i }) as WorshipDefinition,
    );
    expect(sortWorshipDefinitions(input).map((item) => item.title)).toEqual([
      'الفجر',
      'الظهر',
      'العصر',
      'المغرب',
      'العشاء',
    ]);
    expect(input[0].title).toBe('العشاء');
  });
  it('keeps obligatory prayers separate from sunnah tracking', () => {
    expect(worshipSections[0].category).toBe('salah');
    expect(worshipSections[1].category).toBe('sunnah_rawatib');
    expect(new Set(worshipSections.map((s) => s.category)).size).toBe(9);
  });

  it('orders by explicit time of day and falls back to id ordering', () => {
    const byTime = [
      { id: 'b', title: 'x', sort_order: 0, time_of_day: 'night' },
      { id: 'a', title: 'y', sort_order: 0, time_of_day: 'fajr' },
    ] as WorshipDefinition[];
    expect(sortWorshipDefinitions(byTime).map((item) => item.id)).toEqual(['a', 'b']);

    const fallback = [
      { id: 'z', title: 'مستحب', sort_order: 5 },
      { id: 'y', title: 'مستحب', sort_order: 1 },
      { id: 'x', title: 'مستحب', sort_order: 1 },
    ] as WorshipDefinition[];
    expect(sortWorshipDefinitions(fallback).map((item) => item.id)).toEqual(['x', 'y', 'z']);
  });
});
