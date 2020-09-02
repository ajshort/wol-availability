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
}

interface AvailabilityData extends Availability {
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

export const SET_MEMBER_AVAILABILITY_MUTATION = gql`
  mutation ($start: DateTime!, $end: DateTime!, $availabilities: [AvailabilityInput!]!) {
    setAvailabilities(start: $start, end: $end, availabilities: $availabilities) {
      _id
      start
      end
      storm
      rescue
      vehicle
      note
    }
  }
`;

interface MemberAvailabilityInput {
  memberNumber: number;
  availabilities: AvailabilityData[]
}

export interface SetMemberAvailabilityData {
  setAvailabilities: AvailabilityData[];
}

export interface SetMemberAvailabilityVars {
  start: Date;
  end: Date;
  availabilities: MemberAvailabilityInput[];
}

export const GET_STATISTICS_QUERY = gql`
  query ($start: DateTime!, $end: DateTime!) {
    statistics(start: $start, end: $end) {
      counts {
        start
        end
        storm
      }
    }
  }
`;

export interface GetStatisticsData {
  statistics: { counts: Array<{ start: string; end: string; storm: number; }> };
}

export interface GetStatisticsVars {
  start: Date;
  end: Date;
}
