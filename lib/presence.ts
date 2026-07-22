/** Fenêtre de présence : un compte est "en ligne" s'il a été vu récemment. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** Instant à partir duquel une activité compte comme "en ligne". */
export function onlineSince(): Date {
  return new Date(Date.now() - ONLINE_WINDOW_MS);
}

export function isOnline(lastSeenAt: Date | null | undefined): boolean {
  return !!lastSeenAt && lastSeenAt >= onlineSince();
}
