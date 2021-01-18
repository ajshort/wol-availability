import { filterAcceptsMember, MemberFilter, MemberFilterButton } from '../components/MemberFilter';
import Page from '../components/Page';
import UnitTable, { UnitTableFooter } from '../components/UnitTable';
import WeekBrowser from '../components/WeekBrowser';
import { mergeAbuttingAvailabilities } from '../model/availability';
import { getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';
import {
  compareFloodRescue,
  FLOOD_RESCUE,
  FLOOD_RESCUE_L1,
  FLOOD_RESCUE_L2,
  FLOOD_RESCUE_L3,
  MANUAL_DRIVER,
  PAD,
  VERTICAL_RESCUE,
} from '../model/qualifications';
import {
  GET_MEMBERS_AVAILABILITIES_QUERY,
  GetMembersAvailabilitiesData,
  GetMembersAvailabilitiesVars,
  MemberWithAvailabilityData,
} from '../queries/availability';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
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
  immediateOnly?: boolean;
  sort?: (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => number;
  footers?: UnitTableFooter[];
}

interface Params {
  week?: string;
}

const Rescue: React.FC<RescueProps> = props => {
  const { title, baseUrl, immediateOnly, qualifications, sort, footers } = props;

  const history = useHistory();
  const params = useParams<Params>();

  const [filter, setFilter] = useState<MemberFilter>({});

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

  const handleChangeWeek = (value: Interval) => {
    history.push(`${baseUrl}/${value.start.toISODate()}`);
  };

  const teams = data ? _.uniq(_.map(data.members, 'team')).sort() : undefined;
  const quals = data ? _.uniq(_.flatMap(data.members, 'qualifications')).sort() : undefined;

  return (
    <Page title={title}>
      <Nav variant='tabs' className='mt-1'>
        <Nav.Item>
          <LinkContainer to='/unit/vr'>
            <Nav.Link>
              <span className='d-none d-lg-inline'>Vertical Rescue</span>
              <span className='d-lg-none'>VR</span>
            </Nav.Link>
          </LinkContainer>
        </Nav.Item>
        <Nav.Item>
          <LinkContainer to='/unit/fr'>
            <Nav.Link>
              <span className='d-none d-lg-inline'>Flood Rescue</span>
              <span className='d-lg-none'>FR</span>
            </Nav.Link>
          </LinkContainer>
        </Nav.Item>
        <Nav.Item>
          <LinkContainer to='/unit/pad'>
              <Nav.Link>
                <span className='d-none d-lg-inline'>Public Access Defib</span>
                <span className='d-lg-none'>PAD</span>
              </Nav.Link>
          </LinkContainer>
        </Nav.Item>
      </Nav>
      <div className='d-flex align-items-center justify-content-between border-bottom p-3'>
        <div>
          <MemberFilterButton
            id='storm-member-filter'
            teams={teams}
            qualifications={quals}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <div>
          <WeekBrowser value={week} onChange={handleChangeWeek} />
        </div>
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

        const members = data.members.filter(member => filterAcceptsMember(filter, member));

        return (
          <UnitTable
            className='unit-table-rescue'
            interval={week}
            members={members}
            featuredQualifications={qualifications.length > 1 ? qualifications : []}
            sort={sort}
            infoColumns={[
              {
                key: 'callsign',
                className: 'unit-table-callsign d-none d-xl-flex',
                heading: 'Callsign',
                render: (member) => member.callsign,
              },
              {
                key: 'dov',
                className: 'unit-table-dov d-none d-xl-flex',
                heading: 'DOV',
                render: ({ driverLevel, qualifications }) => {
                  if (typeof driverLevel !== 'number') {
                    return null;
                  }

                  let classNames: string[] = [];

                  if (driverLevel === 3) {
                    classNames.push('dov-badge-3');
                  } else if (driverLevel === 2) {
                    classNames.push('dov-badge-2');
                  }

                  if (!qualifications.includes(MANUAL_DRIVER)) {
                    classNames.push('dov-badge-auto-only');
                  }

                  return <Badge className={clsx(classNames)}>{`L${driverLevel}`}</Badge>
                },
              }
            ]}
            renderMember={(interval, member) => (
              mergeAbuttingAvailabilities(
                member
                  .availabilities
                  .filter(({ rescue }) => immediateOnly ? (rescue === 'IMMEDIATE') : (rescue !== undefined))
                  .map(({ start, end, ...data }) => ({
                    interval: Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end)), ...data
                  }))
                  .sort((a, b) => a.interval.start.toMillis() - b.interval.start.toMillis()),
                ['rescue', 'vehicle', 'note'],
              ).map(availability => {
                const left = getIntervalPosition(interval, availability.interval.start);
                const right = getIntervalPosition(interval, availability.interval.end);

                return (
                  <div
                    key={availability.interval.toString()}
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
                    {availability.note && (
                      <Badge variant='secondary'>{availability.note}</Badge>
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

function compareCallsigns(a?: string, b?: string) {
  if (!a && !b) {
    return 0;
  }
  if (!b) {
    return -1;
  }
  if (!a) {
    return 1;
  }

  const extract = (callsign: string) => {
    const match = callsign.match(/([A-Z]+)([0-9]+)/);

    if (!match) {
      return undefined;
    }

    return { unit: match[1], number: parseInt(match[2], 10) };
  }

  // Split the callsign and sort by unit and number.
  const ea = extract(a);
  const eb = extract(b);

  if (!ea || !eb) {
    return 0;
  }

  return ea.unit.localeCompare(eb.unit) || ea.number - eb.number;
}

export const VerticalRescue: React.FC = () => (
  <Rescue
    title='Vertical Rescue'
    baseUrl='/unit/vr'
    qualifications={[VERTICAL_RESCUE]}
    sort={(a, b) => (
      compareCallsigns(a.callsign, b.callsign) || a.surname.localeCompare(b.surname)
    )}
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

export const PublicAccessDefib: React.FC = () => (
  <Rescue
    title='Public Access Defib'
    baseUrl='/unit/pad'
    qualifications={[PAD]}
    immediateOnly
    sort={(a, b) => (
      a.surname.localeCompare(b.surname)
    )}
    footers={[
      {
        title: '',
        included: (_, { rescue }) => rescue === 'IMMEDIATE',
        highlightLessThan: 2,
      },
    ]}
  />
);
