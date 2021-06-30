import gql from 'graphql-tag';

export interface MemberFilter {
  qualificationsAny?: string[];
}

export interface MemberData {
  number: number;
  fullName: string;
  lastName: string;
  rank: string;
  qualifications: string[];
}

export interface GetMembersVars {
  unit: string;
  filter?: MemberFilter;
}

interface MemberWithUnitsData extends MemberData {
  units: Array<{ code: string; team?: string; }>;
}

export interface GetMembersData {
  unit: { members: MemberWithUnitsData[]; };
}

export const GET_MEMBERS_QUERY = gql`
  query($unit: String!, $filter: MemberFilter) {
    unit(code: $unit) {
      members(filter: $filter) {
        number
        fullName
        lastName
        rank
        qualifications

        units {
          code
          team
        }
      }
    }
  }
`;
