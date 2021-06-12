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
  mutation ($unitCode: String!, $memberNumber: Int!, $start: DateTime!, $end: DateTime!, $availabilities: [AvailabilityInput!]!) {
    setAvailabilities(unitCode: $unitCode, memberNumber: $memberNumber, start: $start, end: $end, availabilities: $availabilities) {
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

export interface SetMemberAvailabilityData {
  setAvailabilities: AvailabilityData[];
}

export interface SetMemberAvailabilityVars {
  unitCode: string;
  memberNumber: number;
  start: Date;
  end: Date;
  availabilities: AvailabilityData[];
}

export function useMutateMemberAvailability(unitCode: string, memberNumber: number, interval: Interval) {
  return useMutation<SetMemberAvailabilityData, SetMemberAvailabilityVars>(SET_MEMBER_AVAILABILITY_MUTATION, {
    update: (cache, { data }) => {
      const variables: GetMemberAvailabilityVars = {
        unitCode,
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

export interface SetDefaultAvailabilityVars {
  memberNumber: number;
  start: Date;
  availabilities: AvailabilityData[];
}

export const SET_DEFAULT_AVAILABILITY_MUTATION = gql`
  mutation ($memberNumber: Int!, $start: DateTime!, $availabilities: [AvailabilityInput!]!) {
    setDefaultAvailability(memberNumber: $memberNumber, start: $start, availabilities: $availabilities)
  }
`;

export interface ApplyDefaultAvailabilityVars {
  unitCode: string;
  memberNumber: number;
  start: Date;
}

export const APPLY_DEFAULT_AVAILABILITY_MUTATION = gql`
  mutation ($unitCode: String!, $memberNumber: Int!, $start: DateTime!) {
    applyDefaultAvailability(unitCode: $unitCode, memberNumber: $memberNumber, start: $start)
  }
`;
