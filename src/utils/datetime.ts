import { UI_LOCALE } from '@/constants/locale';
import { DateTime } from 'luxon';

/**
 * Interprets `datetime-local` value as wall time in the given IANA zone and returns UTC ISO for the API.
 */
export function venueStartToUtcIso(
  datetimeLocal: string,
  ianaTimeZone: string,
): string {
  const dt = DateTime.fromISO(datetimeLocal, { zone: ianaTimeZone });
  if (!dt.isValid) {
    throw new Error(`Invalid date or timezone: ${dt.invalidReason}`);
  }
  const utc = dt.toUTC();
  const iso = utc.toISO();
  if (!iso) {
    throw new Error('Could not convert to ISO string');
  }
  return iso;
}

export function formatEventStartDisplay(
  startsAtIso: string,
  timeZone: string,
): string {
  const dt = DateTime.fromISO(startsAtIso, { zone: 'utc' }).setZone(timeZone);
  if (!dt.isValid) {
    return startsAtIso;
  }
  return dt.setLocale(UI_LOCALE).toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
}
