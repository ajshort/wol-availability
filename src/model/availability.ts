import { DateTime, Interval } from 'luxon';
import { MemberWithAvailabilityData } from '../queries/availability';
import { MemberData } from '../queries/members';

export enum Shift {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export type StormAvailable = 'AVAILABLE' | 'UNAVAILABLE';
export type RescueAvailable = 'IMMEDIATE' | 'SUPPORT' | 'UNAVAILABLE';

export interface Availability {
  storm?: StormAvailable;
  rescue?: RescueAvailable;
  vehicle?: string;
  note?: string;
}

export interface AvailabilityInterval extends Availability {
  interval: Interval;
}

export type AvailabilityIncludedFn = (member: MemberData, availability: Availability) => boolean;

/**
 * For each interval in @a intervals, calculates the minimum number of members which satisfy
 * the @a included callback at any particular time within the interval.
 */
export function calculateMinimumAvailabilities(
  intervals: Interval[], members: MemberWithAvailabilityData[], included: AvailabilityIncludedFn
) {
  // Get all intervals for which a member is available.
  const availables = members.flatMap(member => member.availabilities
    .filter(availability => included(member, availability))
    .map(({ start, end }) => Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end)))
  );

  // Counts how many availables there are at @a dt.
  const countAvailable = (dt: DateTime) => {
    let count = 0;
    for (const available of availables) {
      if (available.contains(dt)) {
        count++;
      }
    }
    return count;
  };

  // Go through each interval.
  return intervals.map(interval => {
    // Get any available interval starts and ends within this interval.
    const starts = availables.filter(avail => interval.contains(avail.start)).map(({ start }) => start);
    const ends = availables.filter(avail => interval.contains(avail.end)).map(({ end }) => end);
    const breaks = [...starts, ...ends];

    return Math.min(countAvailable(interval.start), ...breaks.map(countAvailable));
  });
}
