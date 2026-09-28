import { describe, expect, it } from 'vitest';
import { useCalendarStore } from './calendarStore';

describe('calendar store', () => {
  it('accepts direct arrays and functional updaters', () => {
    useCalendarStore.getState().setCalendarEvents([{ id: 'event-1' } as never]);
    useCalendarStore.getState().setCalendarEvents((current) => [...current, { id: 'event-2' } as never]);
    expect(useCalendarStore.getState().calendarEvents.map((event) => event.id)).toEqual(['event-1', 'event-2']);
  });
});
