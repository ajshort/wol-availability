import gql from 'graphql-tag';

export interface MemberFilter {
  unitsAny?: string[];
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
      lastName
      rank
      qualifications
    }
  }
`;
