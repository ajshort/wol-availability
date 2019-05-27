export const TIME_ZONE = 'Australia/Sydney';

/**
 * The first day of the shift week (0 is Sunday).
 */
export const WEEK_START_DAY = 1;

/**
 * The shifts in each day.
 */
export const SHIFTS = ['MORNING', 'AFTERNOON', 'NIGHT'];

/**
 * Hours for each shift.
 */
export const SHIFT_HOURS = {
  'MORNING': [6, 12],
  'AFTERNOON': [12, 18],
  'NIGHT': [18, 6],
};

/**
 * The shift where the shift week starts.
 */
export const WEEK_START_SHIFT = 'NIGHT';
