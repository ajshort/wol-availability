import { MemberWithAvailabilityData } from '../queries/availability';
import { MemberData } from '../queries/members';

import _ from 'lodash';
import { DateTime, Interval } from 'luxon';

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
  intervals: Interval[], data: MemberWithAvailabilityData[], included: AvailabilityIncludedFn
) {
  // Get all intervals for which a member is available.
  const availables = data.flatMap(entry => entry.availabilities
    .filter(availability => included(entry.member, availability))
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

/**
 * Merges abutting sorted availabilities.
 */
export function mergeAbuttingAvailabilities(
  availabilities: AvailabilityInterval[], fields = ['storm', 'rescue', 'vehicle', 'note']
) {
  const merged: AvailabilityInterval[] = [];

  for (const value of availabilities) {
    const last = _.last(merged);
    const merge =
      last !== undefined &&
      last.interval.abutsStart(value.interval) &&
      _.isEqual(
        _.pickBy(_.pick(last, fields), _.identity),
        _.pickBy(_.pick(value, fields), _.identity),
      );

    if (merge) {
      merged[merged.length - 1].interval = last!.interval.set({ end: value.interval.end });
    } else {
      merged.push(value);
    }
  }

  return merged;
}
