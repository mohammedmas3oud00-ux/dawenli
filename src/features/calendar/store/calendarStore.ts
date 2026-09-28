import { create } from 'zustand';
import type { CalendarEvent } from '../../../types/hierarchical';

interface CalendarStoreState {
  calendarEvents: CalendarEvent[];
  setCalendarEvents(value: CalendarEvent[] | ((current: CalendarEvent[]) => CalendarEvent[])): void;
}

export const useCalendarStore = create<CalendarStoreState>((set) => ({
  calendarEvents: [],
  setCalendarEvents: (value) => set((state) => ({ calendarEvents: typeof value === 'function' ? value(state.calendarEvents) : value })),
}));
