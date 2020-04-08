import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import WeekBrowser from '../components/WeekBrowser';
import WeekTable from '../components/WeekTable';
import { Availability, StormAvailable } from '../model/availability';
import { getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';

import gql from 'graphql-tag';
import { DateTime, Interval } from 'luxon';
import React from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Spinner from 'react-bootstrap/Spinner';
import { FaBolt, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';

const GET_MEMBER_QUERY = gql`
  query ($number: Int!) {
    member(number: $number) {
      fullName
    }
  }
`;

interface MemberData {
  fullName: string;
}

interface GetMemberData {
  member: MemberData | null;
}

const StormBadge: React.FC<{ available?: StormAvailable }> = ({ available }) => {
  if (available === undefined) {
    return null;
  }

  return (
    <Badge variant='success' className='mr-1'>
      <span className='d-md-none'><FaBolt /></span>
      <span className='d-none d-md-inline'>Storm</span>
    </Badge>
  );
};

interface RowProps {
  interval: Interval;
  availabilities: Availability[];
  rescue?: boolean;
}

const Row: React.FC<RowProps> = ({ interval, availabilities, rescue }) => (
  <React.Fragment>
    {availabilities.filter(a => a.interval.overlaps(interval)).map(availability => {
      const intersection = availability.interval.intersection(interval)!;

      const l = getIntervalPosition(interval, intersection.start);
      const r = 1 - getIntervalPosition(interval, intersection.end);
      const style = { left: `${100 * l}%`, right: `${100 * r}%` };

      // If we're a rescue member, we require both to be green to go green and vice versa for red.
      // Otherwise we just go yellow. For non-rescue members, just use the colour of the storm
      // availability.
      if (!rescue) {
        return (
          <div className='availability-block' style={style}>
            <Badge variant='info'>{availability.note}</Badge>
          </div>
        );
      }

      return (
        <div className='availability-block' style={style}>
          <StormBadge available={availability.storm} />
          <Badge variant='warning' className='mr-1'>
            <span className='d-md-none'><FaExclamationTriangle /></span>
            <span className='d-none d-md-inline'>Rescue</span>
          </Badge>
          {availability.vehicle && (
            <Badge variant='info' className='mr-1'>{availability.vehicle}</Badge>
          )}
          {availability.note && (
            <Badge variant='info'>{availability.note}</Badge>
          )}
        </div>
      );
    })}
  </React.Fragment>
);

interface Params {
  member: string;
  week?: string;
}

const ManageMember: React.FC = () => {
  const auth = useAuth();
  const params = useParams<Params>();
  const history = useHistory();

  let number: number;

  if (params.member === 'me') {
    number = (auth.member as any).number;
  } else {
    number = parseInt(params.member, 10);
  }

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const handleChangeWeek = (value: Interval) => {
    if (number === (auth.member as any).number) {
      history.push(`/member/me/${value.start.toISODate()}`);
    } else {
      history.push(`/member/${number}/${value.start.toISODate()}`);
    }
  };

  // Hard-coded test data.
  const availabilities: Availability[] = [
    {
      interval: week,
      storm: 'UNAVAILABLE',
      rescue: 'IMMEDIATE',
      vehicle: 'WOL43',
      note: 'OOA',
    },
  ];

  return (
    <Query<GetMemberData> query={GET_MEMBER_QUERY} variables={{ number }}>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <Page title='Member'>
              <Alert variant='info' className='m-3'>
                <Spinner size='sm' animation='border' /> Loading member&hellip;
              </Alert>
            </Page>
          );
        }

        if (error || !data || !data.member) {
          return (
            <Page title='Member'>
              <Alert variant='danger' className='m-3'> Error loading member.</Alert>
            </Page>
          );
        }

        const { member } = data;

        return (
          <Page title={member.fullName}>
            <div className='d-flex align-items-center border-bottom p-3'>
              <Button variant='primary' className='mr-2 d-none d-md-block'>
                <FaPlus /> Set Availability
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant='info' id='week-dropdown' className='mr-2'>
                  Week
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>Storm and Support</Dropdown.Header>
                  <Dropdown.Item>Set available</Dropdown.Item>
                  <Dropdown.Item>Set unavailable</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Header>Rescue</Dropdown.Header>
                  <Dropdown.Item>Set immediate</Dropdown.Item>
                  <Dropdown.Item>Set support</Dropdown.Item>
                  <Dropdown.Item>Set unavailable</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item>Save as my default</Dropdown.Item>
                  <Dropdown.Item>Set to my default</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <WeekBrowser value={week} onChange={handleChangeWeek} />
            </div>
            <WeekTable interval={week}>
              {row => <Row interval={row} availabilities={availabilities} rescue />}
            </WeekTable>
          </Page>
        );
      }}
    </Query>
  );
};

export default ManageMember;
