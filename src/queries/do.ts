import { Shift } from '../model/availability';

import gql from 'graphql-tag';

// Gets the duty officers for a date range
export const GET_DUTY_OFFICERS_QUERY = gql`
  query ($unit: String!, $from: DateTime!, $to: DateTime!) {
    dutyOfficers(unitCode: $unit, from: $from, to: $to) {
      shift
      from
      to
      member {
        fullName
      }
    }
  }
`;

export interface DutyOfficer {
  _id: string;
  shift: Shift;
  from: string;
  to: string;
  member: { fullName: string; }
}

export interface GetDutyOfficersData {
  dutyOfficers: DutyOfficer[];
}

export interface GetDutyOfficersVars {
  unit: string;
  from: Date;
  to: Date;
}

export const SET_DUTY_OFFICER_MUTATION = gql`
  mutation ($unit: String!, $shift: Shift!, $member: Int, $from: DateTime!, $to: DateTime!) {
    setDutyOfficer(unitCode: $unit, shift: $shift, memberNumber: $member, from: $from, to: $to)
  }
`;

export interface SetDutyOfficerVars {
  unit: string;
  shift: Shift;
  member: number | null;
  from: Date;
  to: Date;
}
