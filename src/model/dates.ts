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

/**
 * Gets the day intervals within an overall interval
 */
export function getDayIntervals(interval: Interval): Interval[] {
  return Array
    .from(Array(interval.count('days')).keys())
    .map(i => interval.start.plus({ days: i }))
    .map(dt => Interval.fromDateTimes(dt.startOf('day'), dt.endOf('day')));
}

/**
 * Gets the position in [0, 1] of which @a dt is in @a interval.
 */
export function getIntervalPosition(interval: Interval, dt: DateTime): number {
  if (interval.isAfter(dt)) {
    return 0;
  }

  if (interval.isBefore(dt)) {
    return 1;
  }

  return interval.start.until(dt).length('milliseconds') / interval.length('milliseconds');
}
