import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import WeekBrowser from '../components/WeekBrowser';
import WeekTable from '../components/WeekTable';
import { Availability, StormAvailable, RescueAvailable } from '../model/availability';
import { getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';

import gql from 'graphql-tag';
import { DateTime, Interval } from 'luxon';
import React from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Badge, { BadgeProps } from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Spinner from 'react-bootstrap/Spinner';
import { FaBolt, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import clsx from 'clsx';

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
  let variant = 'info';

  if (available === 'AVAILABLE') {
    variant = 'success';
  } else if (available === 'UNAVAILABLE') {
    variant = 'danger';
  }

  return (
    <Badge variant={variant as BadgeProps['variant']} className='mr-1'>
      <span className='d-md-none'><FaBolt /></span>
      <span className='d-none d-md-inline'>Storm</span>
    </Badge>
  );
};

const RescueBadge: React.FC<{ available?: RescueAvailable }> = ({ available }) => {
  let variant = 'info';

  if (available === 'IMMEDIATE') {
    variant = 'success';
  } else if (available === 'SUPPORT') {
    variant = 'warning';
  } else if (available === 'UNAVAILABLE') {
    variant = 'danger';
  }

  return (
    <Badge variant={variant as BadgeProps['variant']} className='mr-1'>
      <span className='d-md-none'><FaExclamationTriangle /></span>
      <span className='d-none d-md-inline'>Rescue</span>
    </Badge>
  );
};

interface RowProps {
  interval: Interval;
  availabilities: Availability[];
  rescueMember?: boolean;
}

const Row: React.FC<RowProps> = ({ interval, availabilities, rescueMember }) => (
  <React.Fragment>
    {availabilities.filter(a => a.interval.overlaps(interval)).map(availability => {
      const { storm, rescue, note, vehicle } = availability;
      const intersection = availability.interval.intersection(interval)!;

      const l = getIntervalPosition(interval, intersection.start);
      const r = 1 - getIntervalPosition(interval, intersection.end);
      const style = { left: `${100 * l}%`, right: `${100 * r}%` };

      // If we're a rescue member, we require both to be green to go green and vice versa for red.
      // Otherwise we just go yellow. For non-rescue members, just use the colour of the storm
      // availability.
      const classes = ['availability-block'];

      if ((!rescueMember || rescue === 'IMMEDIATE') && storm === 'AVAILABLE') {
        classes.push('availability-success');
      } else if ((!rescueMember || rescue === 'UNAVAILABLE') && storm === 'UNAVAILABLE') {
        classes.push('availability-danger');
      } else {
        classes.push('availability-warning');
      }

      return (
        <div className={clsx(classes)} style={style}>
          {rescueMember && (
            <React.Fragment>
              <StormBadge available={storm} />
              <RescueBadge available={rescue} />
            </React.Fragment>
          )}
          {vehicle && <Badge variant='info'>{vehicle}</Badge>}
          {note && <Badge variant='secondary'>{note}</Badge>}
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
  const thirds = week.divideEqually(3);

  const availabilities: Availability[] = [
    {
      interval: thirds[0],
      storm: 'AVAILABLE',
      rescue: 'IMMEDIATE',
      vehicle: 'WOL43',
    },
    {
      interval: thirds[1],
      storm: 'UNAVAILABLE',
      rescue: 'UNAVAILABLE',
      note: 'OOA',
    },
    {
      interval: thirds[2],
      storm: 'AVAILABLE',
      rescue: 'SUPPORT',
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
              {row => <Row interval={row} availabilities={availabilities} rescueMember />}
            </WeekTable>
          </Page>
        );
      }}
    </Query>
  );
};

export default ManageMember;
