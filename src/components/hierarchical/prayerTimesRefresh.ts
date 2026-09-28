export function shouldRefreshPrayerTimes(
  loadedLocalDate: string,
  currentLocalDate: string,
  visibilityState: DocumentVisibilityState = 'visible',
): boolean {
  return visibilityState === 'visible' && loadedLocalDate !== currentLocalDate;
}
