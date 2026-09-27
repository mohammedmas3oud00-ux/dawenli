import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VaultLearning } from './VaultLearning';
import type { VaultItem } from '../../types/hierarchical';
afterEach(cleanup);
const item: VaultItem = { id: 'book', title: 'كتاب', vault_type: 'books', pillar_id: 'p', summary: '', content: '', tags: [], created_at: '2026-09-27', learning: { kind: 'book', total: 100, completed: 10, daily_target: 5, sessions: [], lessons: [] } };
describe('learning tracker', () => {
  it('records progress and notes without overwriting the book content', () => {
    const save = vi.fn(); render(<VaultLearning item={item} onSave={save} />);
    fireEvent.change(screen.getByLabelText('الكمية المنجزة'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('ملاحظات جلسة التعلم'), { target: { value: 'ملخص الفصل' } });
    fireEvent.click(screen.getByText('تسجيل إنجاز'));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: 'book', learning: expect.objectContaining({ completed: 15, sessions: [expect.objectContaining({ units: 5, note: 'ملخص الفصل' })] }) }));
    expect(save.mock.calls[0][0]).not.toHaveProperty('content');
  });
  it('blocks progress past the total', () => {
    render(<VaultLearning item={item} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('الكمية المنجزة'), { target: { value: '101' } });
    expect(screen.getByText('تسجيل إنجاز')).toBeDisabled();
  });
  it('completes a named course lesson with a matching session', () => {
    const save = vi.fn(); render(<VaultLearning item={{ ...item, vault_type: 'resources', learning: { ...item.learning!, kind: 'course', lessons: [{ id: 'lesson', title: 'مقدمة', completed: false }] } }} onSave={save} />);
    fireEvent.click(screen.getByLabelText('مقدمة'));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ learning: expect.objectContaining({ completed: 11, lessons: [{ id: 'lesson', title: 'مقدمة', completed: true }] }) }));
  });
});
