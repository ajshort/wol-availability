import { Interval } from 'luxon';

export enum Shift {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export type StormAvailable = 'AVAILABLE' | 'UNAVAILABLE';
export type RescueAvailable = 'IMMEDIATE' | 'SUPPORT' | 'UNAVAILABLE';

export interface AvailabilityWithoutInterval {
  storm?: StormAvailable;
  rescue?: RescueAvailable;
  vehicle?: string;
  note?: string;
}

export interface Availability extends AvailabilityWithoutInterval {
  interval: Interval;
}
