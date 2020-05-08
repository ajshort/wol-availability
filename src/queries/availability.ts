import { AvailabilityInterval, RescueAvailable, StormAvailable } from '../model/availability';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { DateTime, Interval } from 'luxon';

const GET_MEMBER_AVAILABILITY_QUERY = gql`
  query ($memberNumber: Int!, $start: DateTime!, $end: DateTime!) {
    member(number: $memberNumber) {
      fullName

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

interface MemberAvailabilityData {
  start: string;
  end: string;
  storm?: StormAvailable;
  rescue?: RescueAvailable;
  vehicle?: string;
  note?: string;
}

interface GetMemberAvailabilityData {
  member: {
    fullName: string;
    availabilities: MemberAvailabilityData[];
  } | null;
}

interface GetMemberAvailabilityVars {
  memberNumber: number;
  start: Date;
  end: Date;
}

export function useMemberAvailability(memberNumber: number, interval: Interval) {
  const { loading, error, data } = useQuery<GetMemberAvailabilityData, GetMemberAvailabilityVars>(
    GET_MEMBER_AVAILABILITY_QUERY,
    {
      variables: {
        memberNumber,
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
      },
    },
  );

  return {
    loading,
    error,
    data: (data !== undefined && data.member !== null) ? ({
      member: {
        fullName: data.member.fullName,
      },
      availabilities: data.member.availabilities.map(({ start, end, ...rest }) => (<AvailabilityInterval> {
        interval: Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end)), ...rest
      })),
    }) : undefined,
  };
}
