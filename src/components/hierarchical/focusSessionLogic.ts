import type { FocusMode } from '../../types/hierarchical';

export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

type CompletionDurationInput = {
  mode: FocusMode;
  pomodoroPhase: PomodoroPhase;
  workDurationSeconds: number;
  secondsRemaining: number;
  flowSeconds: number;
  isInBreak: boolean;
};

export function getFocusCompletionDuration({
  mode,
  pomodoroPhase,
  workDurationSeconds,
  secondsRemaining,
  flowSeconds,
  isInBreak,
}: CompletionDurationInput): number {
  if (mode === 'pomodoro') {
    if (pomodoroPhase !== 'work') return 0;
    return Math.max(0, workDurationSeconds - secondsRemaining);
  }

  if (isInBreak) return 0;
  return Math.max(0, flowSeconds);
}
