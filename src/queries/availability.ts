import { RescueAvailable, StormAvailable } from '../model/availability';
import gql from 'graphql-tag';

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

interface AvailabilityData {
  start: string;
  end: string;
  storm?: StormAvailable;
  rescue?: RescueAvailable;
  vehicle?: string;
  note?: string;
}

interface MemberWithAvailabilityData extends MemberData {
  availabilities: AvailabilityData[];
}

export interface GetMemberAvailabilityData {
  member: MemberWithAvailabilityData | null;
}

export interface GetMemberAvailabilityVars {
  memberNumber: number;
  start: Date;
  end: Date;
}

export const SET_MEMBER_AVAILABILITY_MUTATION = gql`
  mutation ($availabilities: [AvailabilityInput!]!) {
    setAvailabilities(availabilities: $availabilities)
  }
`;

interface AvailabilityInput {
  memberNumber: number;
  start: Date;
  end: Date;
  storm?: StormAvailable;
  rescue?: RescueAvailable;
  vehicle?: string;
  note?: string;
}

export interface SetMemberAvailabilityVars {
  availabilities: AvailabilityInput[];
}
