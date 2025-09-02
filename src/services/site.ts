export function fetchSiteStatus() {
  return fetch('/api/admin/site-status', { cache: 'no-store' });
}
