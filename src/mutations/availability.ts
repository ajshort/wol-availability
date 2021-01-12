import {
  GET_MEMBER_AVAILABILITY_QUERY,
  GetMemberAvailabilityData,
  GetMemberAvailabilityVars,
  SET_MEMBER_AVAILABILITY_MUTATION,
  SetMemberAvailabilityData,
  SetMemberAvailabilityVars,
} from '../queries/availability';
import { useMutation } from '@apollo/client';
import { Interval } from 'luxon';

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
