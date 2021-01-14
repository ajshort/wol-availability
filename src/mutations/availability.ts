import {
  AvailabilityData,
  GET_MEMBER_AVAILABILITY_QUERY,
  GetMemberAvailabilityData,
  GetMemberAvailabilityVars,
} from '../queries/availability';

import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { Interval } from 'luxon';

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

export function useMutateMemberAvailability(memberNumber: number, interval: Interval) {
  return useMutation<SetMemberAvailabilityData, SetMemberAvailabilityVars>(SET_MEMBER_AVAILABILITY_MUTATION, {
    update: (cache, { data }) => {
      const variables: GetMemberAvailabilityVars = {
        memberNumber,
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
      };

      const existing = cache.readQuery<GetMemberAvailabilityData, GetMemberAvailabilityVars>({
        query: GET_MEMBER_AVAILABILITY_QUERY,
        variables,
      });

      if (!existing || !existing.member || !data) {
        return;
      }

      if (!data || !data.setAvailabilities) {
        return;
      }

      cache.writeQuery<GetMemberAvailabilityData, GetMemberAvailabilityVars>({
        query: GET_MEMBER_AVAILABILITY_QUERY,
        variables,
        data: {
          member: {
            ...existing.member, availabilities: data.setAvailabilities
          },
        },
      });

      for (const fieldName of ['availableAt', 'members', 'statistics']) {
        cache.evict({ id: 'ROOT_QUERY', fieldName });
      }

      cache.gc();
    }
  });
};

export interface SetMemberDefaultAvailabilityVars {
  memberNumber: number;
  start: Date;
  availabilities: AvailabilityData[];
}

export const SET_MEMBER_DEFAULT_AVAILABILITY_MUTATION = gql`
  mutation ($memberNumber: Int!, $start: DateTime!, $availabilities: [MemberAvailabilityInput!]!) {
    setDefaultAvailability(memberNumber: $memberNumber, start: $start, availabilities: $availabilities)
  }
`;
