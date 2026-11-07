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

export const isPastEvent = (iso: string, now = new Date()): boolean => {
  return new Date(iso).getTime() < now.getTime();
};

export const isEventReservable = (iso: string, now = new Date()): boolean => {
  return !isPastEvent(iso, now);
};

export const isTodayInNicosia = (dateStrOrIso: string, now = new Date()): boolean => {
  const lower = (dateStrOrIso || '').toLowerCase().trim();
  if (lower === 'tonight' || lower === 'today') {
    return true;
  }
  const targetDate = new Date(dateStrOrIso);
  if (isNaN(targetDate.getTime())) {
    return false;
  }
  const nicosiaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return nicosiaFormatter.format(targetDate) === nicosiaFormatter.format(now);
};

export const currentSeasonLabel = (now = new Date()) => {
  const year = now.getFullYear();
  return `Winter ${year}`;
};
