export function formatDate(value?: string | null): string {
  if (!value) return 'Unpublished';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
