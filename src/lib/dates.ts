const tz = 'Europe/Nicosia';

export const eventDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(iso));

export const getWeekday = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'long'
  }).format(new Date(iso));

export const eventTime = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(iso));

export const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));

export const isThisWeek = (iso: string, now = new Date()) => {
  const d = new Date(iso).getTime() - now.getTime();
  return d >= 0 && d < 7 * 86400000;
};

export const currentSeasonLabel = (now = new Date()) => {
  const year = now.getFullYear();
  return `Winter ${year}`;
};
