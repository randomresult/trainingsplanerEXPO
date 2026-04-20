/**
 * Format seconds to MM:SS format
 * @param seconds Total seconds
 * @returns Formatted time string (e.g., "05:32")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
