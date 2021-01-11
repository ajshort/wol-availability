import gql from 'graphql-tag';

export interface MemberFilter {
  unit?: string;
  team?: string;
  qualificationsAny?: string[];
}

export interface MemberData {
  number: number;
  fullName: string;
  surname: string;
  rank: string;
  qualifications: string[];
  team: string;
}

export interface GetMembersVars {
  filter?: MemberFilter;
}

export interface GetMembersData {
  members: MemberData[];
}

export const GET_MEMBERS_QUERY = gql`
  query($filter: MemberFilter) {
    members(filter: $filter) {
      number
      fullName
      surname
      rank
      qualifications
      team
    }
  }
`;
