/**
 * Tiny class-name joiner (no dependencies).
 * Falsy values are dropped, so conditional classes read naturally:
 *   cn('btn', isActive && 'btn-active', className)
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
