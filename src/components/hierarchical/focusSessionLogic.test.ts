import { describe, expect, it } from 'vitest';
import { getFocusCompletionDuration } from './focusSessionLogic';

describe('focus completion duration', () => {
  it('does not count break time as pomodoro work', () => {
    expect(
      getFocusCompletionDuration({
        mode: 'pomodoro',
        pomodoroPhase: 'short_break',
        workDurationSeconds: 1500,
        secondsRemaining: 300,
        flowSeconds: 0,
        isInBreak: true,
      }),
    ).toBe(0);
  });

  it('counts only elapsed work time', () => {
    expect(
      getFocusCompletionDuration({
        mode: 'pomodoro',
        pomodoroPhase: 'work',
        workDurationSeconds: 1500,
        secondsRemaining: 900,
        flowSeconds: 0,
        isInBreak: false,
      }),
    ).toBe(600);
    expect(
      getFocusCompletionDuration({
        mode: 'flowtime',
        pomodoroPhase: 'work',
        workDurationSeconds: 1500,
        secondsRemaining: 0,
        flowSeconds: 100,
        isInBreak: true,
      }),
    ).toBe(0);
  });
});
