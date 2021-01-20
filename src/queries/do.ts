import { Shift } from '../model/availability';

import gql from 'graphql-tag';

// Gets the duty officers for a date range
export const GET_DUTY_OFFICERS_QUERY = gql`
  query ($from: DateTime!, $to: DateTime!) {
    dutyOfficers(from: $from, to: $to) {
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
  from: Date;
  to: Date;
}

export const SET_DUTY_OFFICER_MUTATION = gql`
  mutation ($shift: TeamShift!, $member: Int, $from: DateTime!, $to: DateTime!) {
    setDutyOfficer(shift: $shift, member: $member, from: $from, to: $to)
  }
`;

export interface SetDutyOfficerVars {
  shift: Shift;
  member: number | null;
  from: Date;
  to: Date;
}
