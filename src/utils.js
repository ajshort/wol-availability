import moment from 'moment-timezone';

import { SHIFTS, SHIFT_HOURS, TIME_ZONE, WEEK_START_DAY, WEEK_START_SHIFT } from './config';

export function getDocumentTitle(pageTitle) {
  return `${pageTitle} | WOL SES Availability`;
}

export function getWeekStart(instant = moment()) {
  const result = instant.clone().tz(TIME_ZONE);

  if (result.day() < WEEK_START_DAY) {
    result.subtract(1, 'week').day(WEEK_START_DAY);
  } else if (result.day() > WEEK_START_DAY) {
    result.day(WEEK_START_DAY);
  } else {
    const start = getShiftHours(WEEK_START_SHIFT)[0];

    if (result.hour() < start) {
      result.subtract(1, 'week').day(WEEK_START_DAY);
    }
  }

  return result;
}

export function getWeekEnd(start = moment()) {
  // Only if we switch shifts at the beginning of the day does the shift week actually contain
  // 7 days - otherwise it kinda contains 8.
  if (WEEK_START_SHIFT === SHIFTS[0]) {
    return start.clone().add(6, 'days');
  }

  return start.clone().add(7, 'days');
}

export function getShiftHours(shift) {
  return SHIFT_HOURS[shift];
}

/**
 * Converts an array if individual shift records into a useful 2D array for the week.
 */
export function getMemberShiftAvailability(week, records) {
  if (week.day() !== WEEK_START_DAY) {
    throw new Error('Week does not start of week start day');
  }

  const availability = [];

  // How many days are in a week?
  const days = (WEEK_START_SHIFT === SHIFTS[0]) ? 7 : 8;

  // Which shifts are only present of the first and last days?
  let first = [...SHIFTS];
  let last = [];

  for (let i = 0; i < SHIFTS.indexOf(WEEK_START_SHIFT); ++i) {
    last.push(first.shift());
  }

  for (let i = 0; i < days; ++i) {
    const date = week.clone().add(i, 'days').format('YYYY-MM-DD');

    const shifts = SHIFTS.map(shift => {
      if (i === 0 && !first.includes(shift)) {
        return { shift, enabled: false };
      }

      if (i === 7 && !last.includes(shift)) {
        return { shift, enabled: false };
      }

      const record = records.find(record => (
        record.date === date && record.shift === shift
      ));

      return { shift, enabled: true, available: record ? record.available : undefined };
    });

    availability.push({
      date: week.clone().add(i, 'days'), shifts
    });
  }

  return availability;
}

export function formatMobile(mobile) {
  const nums = mobile.replace(/\s/g, '');

  if (!/[0-9]{10}/.test(nums)) {
    return mobile;
  }

  return [nums.substring(0, 4), nums.substring(4, 7), nums.substring(7, 10)].join(' ');
}
