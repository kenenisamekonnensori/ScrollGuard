/**
 * Converts duration seconds into whole minutes using floor rounding.
 */
export function toMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}
