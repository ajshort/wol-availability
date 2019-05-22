import moment from 'moment-timezone';

import { TIME_ZONE, WEEK_START_DAY, WEEK_START_SHIFT } from './config';

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

export function getShiftHours(shift) {
  if (shift === 'MORNING') {
    return [6, 12];
  } else if (shift === 'AFTERNOON') {
    return [12, 18];
  } else if (shift === 'NIGHT') {
    return [18, 6];
  } else {
    throw new Error(`Unknown shift ${shift}`);
  }
}

/**
 * Gets the days and shifts for a week.
 */
export function getWeekShifts(week) {
  if (week.day() !== WEEK_START_DAY) {
    throw new Error('Invalid start day');
  }

  let first = ['MORNING', 'AFTERNOON', 'NIGHT'];
  let last = [];

  if (WEEK_START_SHIFT === 'AFTERNOON') {
    last.push(first.shift());
  } else if (WEEK_START_SHIFT === 'NIGHT') {
    last.push(first.shift());
    last.push(first.shift());
  }

  const days = [];
  const max = (WEEK_START_SHIFT === 'MORNING') ? 7 : 8;

  for (let i = 0; i < max; ++i) {
    let shifts;

    if (i === 0) {
      shifts = first;
    } else if (i === 7) {
      shifts = last;
    } else {
      shifts = ['MORNING', 'AFTERNOON', 'NIGHT'];
    }

    days.push({ date: week.clone().add(i, 'days'), shifts });
  }

  return days;
}

export function getQualificationName(value) {
  switch (value) {
    case 'CHAINSAW_CROSSCUT':
      return 'Chainsaw cross-cut';
    case 'FLOOD_RESCUE_1':
      return 'Flood rescue 1 (on land)';
    case 'FLOOD_RESCUE_2':
      return 'Flood rescue 2 (on water)';
    case 'FLOOD_RESCUE_3':
      return 'Flood rescue 3 (in water)';
    case 'LAND_SEARCH':
      return 'Land search';
    case 'STORM_WATER_DAMAGE':
      return 'Storm water damage';
    case 'VERTICAL_RESCUE':
      return 'Vertical rescue';
    default:
      return 'Unknown qualification';
  }
}

export function getQualificationAbbreviation(value) {
  switch (value) {
    case 'CHAINSAW_CROSSCUT':
      return 'CS';
    case 'FLOOD_RESCUE_1':
      return 'FR1';
    case 'FLOOD_RESCUE_2':
      return 'FR2';
    case 'FLOOD_RESCUE_3':
      return 'FR3';
    case 'LAND_SEARCH':
      return 'LS';
    case 'STORM_WATER_DAMAGE':
      return 'SWD';
    case 'VERTICAL_RESCUE':
      return 'VR';
    default:
      return '?';
  }
}
