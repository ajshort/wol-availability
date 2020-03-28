import { DateTime, Interval } from 'luxon';

const WEEK_START = {
  hour: 18,
  millisecond: 0,
  minute: 0,
  second: 0,
  weekday: 1,
};

/**
 * Gets the current time in NSW.
 */
export function getNow(): DateTime {
  return DateTime.local().setZone('Australia/Sydney');
}

/**
 * Gets the shift week interval which contains @a dt. If
 */
export function getWeekInterval(dt?: DateTime): Interval {
  if (dt === undefined) {
    dt = getNow();
  }

  const start = dt.set(WEEK_START);
  const end = start.plus({ weeks: 1 });

  return Interval.fromDateTimes(start, end);
}
