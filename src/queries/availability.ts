import { MemberFilter } from './members';
import { Availability } from '../model/availability';
import gql from 'graphql-tag';

export const GET_MEMBERS_AVAILABILITIES_QUERY = gql`
  query ($units: [String!]!, $start: DateTime!, $end: DateTime!, $filter: MemberFilter) {
    units(filter: { codeAny: $units }) {
      code
      name

      membersWithAvailabilities(start: $start, end: $end, filter: $filter) {
        member {
          number
          fullName
          lastName
          callsign
          rank
          qualifications
        }

        availabilities {
          start
          end
          storm
          rescue
          vehicle
          note
        }

        membership {
          code
          team
        }
      }
    }
  }
`;

interface UnitAvailabilityData {
  code: string;
  name: string;
  membersWithAvailabilities: MemberWithAvailabilityData[];
}

interface MemberData {
  number: number;
  fullName: string;
  lastName: string;
  rank: string;
  callsign?: string;
  qualifications: string[];
}

interface MembershipData {
  code: string;
  team?: string;
}

export interface AvailabilityData extends Availability {
  start: string;
  end: string;
}

export interface MemberWithAvailabilityData {
  member: MemberData;
  availabilities: AvailabilityData[];
  membership: MembershipData;
}

export interface GetMembersAvailabilitiesData {
  units: UnitAvailabilityData[];
}

export interface GetMembersAvailabilitiesVars {
  units: string[];
  start: Date;
  end: Date;
  filter?: MemberFilter;
}

export const GET_MEMBER_AVAILABILITY_QUERY = gql`
  query ($unitCode: String!, $memberNumber: Int!, $start: DateTime!, $end: DateTime!) {
    member(number: $memberNumber) {
      number
      fullName
      lastName
      rank
      callsign
      qualifications

      availabilities(unitCode: $unitCode, start: $start, end: $end) {
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
  member?: MemberData & { availabilities: AvailabilityData[] };
}

export interface GetMemberAvailabilityVars {
  unitCode: string;
  memberNumber: number;
  start: Date;
  end: Date;
}

export const GET_STATISTICS_QUERY = gql`
  query ($stormUnitCodes: [String!]!, $rescueUnitCodes: [String!]!, $start: DateTime!, $end: DateTime!) {
    statistics(stormUnitCodes: $stormUnitCodes, rescueUnitCodes: $rescueUnitCodes, start: $start, end: $end) {
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
  };
}

export interface GetStatisticsVars {
  stormUnitCodes: string[];
  rescueUnitCodes: string[];
  start: Date;
  end: Date;
}
