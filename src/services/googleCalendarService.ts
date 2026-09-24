import { TimeBlock } from '../types/hierarchical';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
}

/**
 * Convert Date string (YYYY-MM-DD) and Time string (HH:MM) into an ISO 8601 string
 * respecting the user's local timezone.
 */
function toLocalISOString(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0);
  return date.toISOString();
}

/**
 * Fetch calendar events for a specific day from primary calendar.
 */
export async function fetchCalendarEventsForDay(
  accessToken: string,
  dateStr: string
): Promise<GoogleCalendarEvent[]> {
  try {
    const timeMin = new Date(`${dateStr}T00:00:00`).toISOString();
    const timeMax = new Date(`${dateStr}T23:59:59`).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول إلى تقويم Google');
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `فشل جلب مواعيد التقويم (${res.status})`);
    }

    const data = await res.json();
    return (data.items || []).filter((item: any) => item.status !== 'cancelled');
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

/**
 * Create a new event on Google Calendar from a TimeBlock.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  block: TimeBlock,
  taskTitle?: string,
  projectTitle?: string
): Promise<GoogleCalendarEvent> {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const startIso = toLocalISOString(block.date, block.start_time);
    const endIso = toLocalISOString(block.date, block.end_time);

    let desc = `مجدول عبر دوّنلي (نظام الإنتاجية الشخصية)\nالنوع: ${block.category}`;
    if (projectTitle) desc += `\nالمشروع: ${projectTitle}`;
    if (taskTitle) desc += `\nالمهمة: ${taskTitle}`;
    if (block.notes) desc += `\nملاحظات: ${block.notes}`;

    const eventPayload = {
      summary: block.title,
      description: desc,
      start: {
        dateTime: startIso,
        timeZone,
      },
      end: {
        dateTime: endIso,
        timeZone,
      },
      reminders: {
        useDefault: true,
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `فشل إنشاء موعد في تقويم Google (${res.status})`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Update an existing event on Google Calendar.
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  block: TimeBlock
): Promise<GoogleCalendarEvent> {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const startIso = toLocalISOString(block.date, block.start_time);
    const endIso = toLocalISOString(block.date, block.end_time);

    const eventPayload = {
      summary: block.title,
      description: block.notes || 'مجدول عبر دوّنلي',
      start: {
        dateTime: startIso,
        timeZone,
      },
      end: {
        dateTime: endIso,
        timeZone,
      },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `فشل تعديل الموعد في تقويم Google (${res.status})`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Delete an event from Google Calendar.
 * (MUST be called only after user confirmation modal!)
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok && res.status !== 404) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `فشل حذف الموعد من تقويم Google (${res.status})`);
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}
