/** Best-effort haptic tick. No-ops silently where the Vibration API isn't supported (iOS Safari, desktop). */
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // unsupported — ignore
  }
}
