import { MemberFilter } from './members';
import { Availability } from '../model/availability';
import gql from 'graphql-tag';

export const GET_MEMBERS_AVAILABILITIES_QUERY = gql`
  query ($filter: MemberFilter, $start: DateTime!, $end: DateTime!) {
    members(filter: $filter) {
      number
      fullName
      surname
      rank
      qualifications
      team
      callsign
      driverLevel

      availabilities(start: $start, end: $end) {
        _id
        start
        end
        storm
        rescue
        vehicle
        note
      }
    }
  }
`;

interface MemberData {
  number: number;
  fullName: string;
  surname: string;
  rank: string;
  qualifications: string[];
  team: string;
  callsign?: string;
  driverLevel?: number;
}

export interface AvailabilityData extends Availability {
  start: string;
  end: string;
}

export interface MemberWithAvailabilityData extends MemberData {
  availabilities: AvailabilityData[];
}

export interface GetMembersAvailabilitiesData {
  members: MemberWithAvailabilityData[];
}

export interface GetMembersAvailabilitiesVars {
  filter?: MemberFilter;
  start: Date;
  end: Date;
}

export const GET_MEMBER_AVAILABILITY_QUERY = gql`
  query ($memberNumber: Int!, $start: DateTime!, $end: DateTime!) {
    member(number: $memberNumber) {
      number
      fullName
      surname
      rank
      qualifications
      team

      availabilities(start: $start, end: $end) {
        _id
        start
        end
        storm
        rescue
        vehicle
        note
      }
    }
  }
`;

export interface GetMemberAvailabilityData {
  member: MemberWithAvailabilityData | null;
}

export interface GetMemberAvailabilityVars {
  memberNumber: number;
  start: Date;
  end: Date;
}

export const GET_STATISTICS_QUERY = gql`
  query ($start: DateTime!, $end: DateTime!, $unit: String) {
    statistics(start: $start, end: $end, unit: $unit) {
      counts {
        start
        end
        storm
        vr {
          immediate
          support
        }
        frInWater {
          immediate
        }
        frOnWater {
          immediate
        }
        frOnLand {
          immediate
        }
      }

      teams {
        team
        members
        enteredStorm
      }

      members {
        member {
          fullName
          team
          unit
          qualifications
        }

        storm
        rescueImmediate
        rescueSupport
      }
    }
  }
`;

interface StatisticCount {
  start: string;
  end: string;
  storm: number;
  vr: { immediate: number; support: number };
  frInWater: { immediate: number };
  frOnWater: { immediate: number };
  frOnLand: { immediate: number };
}

interface TeamEnteredCount {
  team: string;
  members: number;
  enteredStorm: number;
}

interface MemberAvailabilitySum {
  member: { fullName: string; unit: string; team: string; qualifications: string[]; };
  storm: number;
  rescueImmediate: number;
  rescueSupport: number;
}

export interface GetStatisticsData {
  statistics: {
    counts: StatisticCount[];
    teams: TeamEnteredCount[];
    members: MemberAvailabilitySum[];
  };
}

export interface GetStatisticsVars {
  start: Date;
  end: Date;
  unit?: string;
}
