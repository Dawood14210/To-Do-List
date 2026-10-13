/** Generate a short, collision-resistant id without extra dependencies. */
export function createId(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
