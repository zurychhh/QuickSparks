/**
 * Combines multiple class names into a single string
 * 
 * @param classes - Class names to combine
 * @returns Combined class names string
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}