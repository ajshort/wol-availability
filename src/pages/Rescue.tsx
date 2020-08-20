import Page from '../components/Page';
import UnitTable, { UnitTableFooter } from '../components/UnitTable';
import WeekBrowser from '../components/WeekBrowser';
import { getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';
import {
  compareFloodRescue,
  FLOOD_RESCUE,
  FLOOD_RESCUE_L1,
  FLOOD_RESCUE_L2,
  FLOOD_RESCUE_L3,
  VERTICAL_RESCUE,
} from '../model/qualifications';
import {
  GET_MEMBERS_AVAILABILITIES_QUERY,
  GetMembersAvailabilitiesData,
  GetMembersAvailabilitiesVars,
  MemberWithAvailabilityData,
} from '../queries/availability';

import clsx from 'clsx';
import { DateTime, Interval } from 'luxon';
import React from 'react';
import { useQuery } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';
import { useHistory, useParams } from 'react-router-dom';

interface RescueProps {
  title: string;
  baseUrl: string;
  qualifications: string[];
  sort?: (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => number;
  footers?: UnitTableFooter[];
}

interface Params {
  week?: string;
}

const Rescue: React.FC<RescueProps> = props => {
  const { title, baseUrl, qualifications, sort, footers } = props;

  const history = useHistory();
  const params = useParams<Params>();

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        filter: { qualificationsAny: qualifications },
        start: week.start.toJSDate(),
        end: week.end.toJSDate(),
      },
    },
  );

  const handleWeekChange = (value: Interval) => {
    history.push(`${baseUrl}/${value.start.toISODate()}`);
  };

  return (
    <Page title={title}>
      <Nav variant='tabs' className='mt-1'>
        <Nav.Item>
          <LinkContainer to='/unit/vr'><Nav.Link>Vertical Rescue</Nav.Link></LinkContainer>
        </Nav.Item>
        <Nav.Item>
        <LinkContainer to='/unit/fr'><Nav.Link>Flood Rescue</Nav.Link></LinkContainer>
        </Nav.Item>
      </Nav>
      <div className='border-bottom p-3'>
        <WeekBrowser value={week} onChange={handleWeekChange} />
      </div>
      {(() => {
        if (loading) {
          return (
            <Alert variant='info' className='m-3'>
              <Spinner size='sm' animation='border' /> Loading rescue availabilty&hellip;
            </Alert>
          );
        }

        if (error || !data) {
          return (
            <Alert variant='danger' className='m-3'> Error loading rescue availability.</Alert>
          );
        }

        return (
          <UnitTable
            className='unit-table-rescue'
            interval={week}
            members={data.members}
            featuredQualifications={qualifications.length > 1 ? qualifications : []}
            sort={sort}
            renderMember={(interval, member) => (
              member.availabilities.map(availability => {
                if (availability.rescue === undefined) {
                  return null;
                }

                const left = getIntervalPosition(interval, DateTime.fromISO(availability.start));
                const right = getIntervalPosition(interval, DateTime.fromISO(availability.end));

                return (
                  <div
                    key={availability.start.toString()}
                    className={clsx('unit-table-availability-block', {
                      'availability-success': availability.rescue === 'IMMEDIATE',
                      'availability-warning': availability.rescue === 'SUPPORT',
                      'availability-danger': availability.rescue === 'UNAVAILABLE',
                    })}
                    style={{
                      left: `${left * 100}%`,
                      right: `${(1 - right) * 100}%`,
                    }}
                  >
                    {availability.vehicle && (
                      <Badge variant='info'>{availability.vehicle}</Badge>
                    )}
                  </div>
                );
              })
            )}
            footers={footers}
          />
        );
      })()}
    </Page>
  );
};

export const FloodRescue: React.FC = () => {
  return (
    <Rescue
      title='Flood Rescue'
      baseUrl='/unit/fr'
      qualifications={FLOOD_RESCUE}
      sort={(a, b) => (
        compareFloodRescue(a.qualifications, b.qualifications) ||
        a.team.localeCompare(b.team) ||
        a.surname.localeCompare(b.surname)
      )}
      footers={[
        {
          title: 'In-water',
          included: ({ qualifications }, { rescue }) => (
            rescue === 'IMMEDIATE' && qualifications.includes(FLOOD_RESCUE_L3)
          ),
          highlightLessThan: 3,
        },
        {
          title: 'On-water',
          included: ({ qualifications }, { rescue }) => (
            rescue === 'IMMEDIATE' && qualifications.includes(FLOOD_RESCUE_L2)
          ),
        },
        {
          title: 'On-land',
          included: ({ qualifications }, { rescue }) => (
            rescue === 'IMMEDIATE' && qualifications.includes(FLOOD_RESCUE_L1) && !qualifications.includes(FLOOD_RESCUE_L3)
          )
        },
      ]}
    />
  );
};

export const VerticalRescue: React.FC = () => (
  <Rescue
    title='Vertical Rescue'
    baseUrl='/unit/vr'
    qualifications={VERTICAL_RESCUE}
    footers={[
      {
        title: 'Immediate',
        included: (_, { rescue }) => rescue === 'IMMEDIATE',
        highlightLessThan: 3,
      },
      {
        title: 'Support',
        included: (_, { rescue }) => rescue === 'SUPPORT',
      },
    ]}
  />
);
