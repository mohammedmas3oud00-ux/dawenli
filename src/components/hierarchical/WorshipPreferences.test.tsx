import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WorshipDefinition } from '../../types/hierarchical';
import { WorshipPreferences } from './WorshipPreferences';

afterEach(cleanup);
const base: WorshipDefinition = { id: 'w', pillar_id: 'p', title: 'ورد', category: 'quran_wird', tracking_type: 'pages', frequency: 'daily', is_active: true, sort_order: 0, created_at: '2026-09-01' };
function setup(patch: Partial<WorshipDefinition> = {}) {
  const save = vi.fn();
  render(<WorshipPreferences definition={{ ...base, ...patch }} onSave={save} />);
  fireEvent.click(screen.getByText('إعداد الهدف والتقييم'));
  return save;
}
describe('worship preference controls', () => {
  it('defaults Quran to one quarter juz and thirty days without auto saving', () => {
    const save = setup();
    expect(screen.getByLabelText('هدف ورد')).toHaveValue(1);
    expect(screen.getByLabelText('مدة التدرج بالأيام')).toHaveValue(30);
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('تطبيق الإعدادات'));
    expect(save).toHaveBeenCalledWith('w', { target_pages: 5, progression_days: 30 });
  });
  it('converts chosen quarter juz units and uses the custom duration', () => {
    const save = setup();
    fireEvent.change(screen.getByLabelText('هدف ورد'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('مدة التدرج بالأيام'), { target: { value: '21' } });
    fireEvent.click(screen.getByText('تطبيق الإعدادات'));
    expect(save).toHaveBeenCalledWith('w', { target_pages: 15, progression_days: 21 });
  });
  it('can choose white days alone, both schedules, or neither', () => {
    const save = setup({ category: 'fasting', scheduled_days: [1, 4] });
    fireEvent.click(screen.getByLabelText('الاثنين والخميس'));
    fireEvent.click(screen.getByLabelText('الأيام البيض: 13 و14 و15 هجريًا'));
    fireEvent.click(screen.getByText('تطبيق الإعدادات'));
    expect(save).toHaveBeenLastCalledWith('w', { frequency: 'custom', scheduled_days: [], scheduled_hijri_days: [13, 14, 15] });
    fireEvent.click(screen.getByLabelText('الاثنين والخميس'));
    fireEvent.click(screen.getByText('تطبيق الإعدادات'));
    expect(save).toHaveBeenLastCalledWith('w', { frequency: 'custom', scheduled_days: [1, 4], scheduled_hijri_days: [13, 14, 15] });
    fireEvent.click(screen.getByLabelText('الاثنين والخميس'));
    fireEvent.click(screen.getByLabelText('الأيام البيض: 13 و14 و15 هجريًا'));
    fireEvent.click(screen.getByText('تطبيق الإعدادات'));
    expect(save).toHaveBeenLastCalledWith('w', { frequency: 'custom', scheduled_days: [], scheduled_hijri_days: [] });
  });
  it('validates and saves the qiyam rakaat goal', () => {
    const save = setup({ category: 'qiyam', target_count: 4 });
    fireEvent.change(screen.getByLabelText('هدف ورد'), { target: { value: '0' } });
    expect(screen.getByText('تطبيق الإعدادات')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('هدف ورد'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('مدة التدرج بالأيام'), { target: { value: '366' } });
    expect(screen.getByText('تطبيق الإعدادات')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('مدة التدرج بالأيام'), { target: { value: '14' } });
    fireEvent.click(screen.getByText('تطبيق الإعدادات'));
    expect(save).toHaveBeenCalledWith('w', { target_count: 6, progression_days: 14 });
  });
});
