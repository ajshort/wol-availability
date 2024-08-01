import { useAuth } from '../components/AuthContext';
import MapModal from '../components/MapModal';
import { filterAcceptsMember, MemberFilter, MemberFilterButton } from '../components/MemberFilter';
import Page from '../components/Page';
import UnitTable, { UnitTableFooter } from '../components/UnitTable';
import WeekBrowser from '../components/WeekBrowser';
import { mergeAbuttingAvailabilities } from '../model/availability';
import { getIntervalPosition, getDayIntervals, getWeekInterval, TIME_ZONE } from '../model/dates';
import {
  compareFloodRescue,
  getDriverAuthLevel,
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
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';
import { FaMap } from 'react-icons/fa';
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
  const { config } = useAuth();

  const [filter, setFilter] = useState<MemberFilter>({});
  const [viewMap, setViewMap] = useState(false);

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const days = getDayIntervals(week);
  const visible = Interval.fromDateTimes(days[0].start, days[days.length - 1].end);

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      fetchPolicy: 'network-only',
      variables: {
        units: config.rescueUnits,
        filter: { qualificationsAny: qualifications },
        start: visible.start.toJSDate(),
        end: visible.end.toJSDate(),
      },
    },
  );

  const handleChangeWeek = (value: Interval) => {
    history.push(`${baseUrl}/${value.start.toISODate()}`);
  };

  let members: MemberWithAvailabilityData[] = [];

  if (data) {
    members = data.units.flatMap(unit => unit.membersWithAvailabilities);
  }

  const units = new Set<string>();
  const teams = new Set<string>();

  members.forEach(({ membership }) => {
    units.add(membership.code);

    if (membership.team !== undefined) {
      teams.add(membership.team);
    }
  });

  const filterQualifications = Object.fromEntries(
    _.uniq(members.flatMap(member => member.member.qualifications)).map(qual => ([qual, qual]))
  );

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
        {/* <Nav.Item>
          <LinkContainer to='/unit/fr'>
            <Nav.Link>
              <span className='d-none d-lg-inline'>Flood Rescue</span>
              <span className='d-lg-none'>FR</span>
            </Nav.Link>
          </LinkContainer>
        </Nav.Item> */}
      </Nav>
      <div className='d-flex align-items-center justify-content-between border-bottom p-3'>
        <div>
          <MemberFilterButton
            id='storm-member-filter'
            rescue
            units={Array.from(units).sort()}
            teams={Array.from(teams).sort()}
            qualifications={filterQualifications}
            value={filter}
            onChange={setFilter}
          />
          <Button
            variant='link'
            disabled={members.length === 0}
            onClick={() => setViewMap(true)}
            className='ml-1'
          >
            <FaMap />
          </Button>
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

        members = members.filter(member => filterAcceptsMember(filter, member, true));

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
                render: ({ member }) => member.callsign,
              },
              {
                key: 'dov',
                className: 'unit-table-dov d-none d-xl-flex',
                heading: 'DOV',
                render: ({ member }) => {
                  const level = getDriverAuthLevel(member.qualifications);

                  if (level > 0) {
                    return <Badge className={`dov-badge-${level}`}>{`L${level}`}</Badge>;
                  }

                  return null;
                },
              }
            ]}
            renderMember={(interval, member) => (
              mergeAbuttingAvailabilities(
                member
                  .availabilities
                  .map(({ start, end, rescue, ...data }) => ({
                    interval: Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end)),
                    rescue: (immediateOnly && rescue === 'SUPPORT') ? 'UNAVAILABLE' : rescue,
                    ...data,
                  }))
                  .sort((a, b) => a.interval.start.toMillis() - b.interval.start.toMillis()),
                ['rescue', 'vehicle', 'note'],
              ).map(availability => {
                if (!interval.overlaps(availability.interval)) {
                  return null;
                }

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
      {viewMap && (
        <MapModal members={members} rescue onHide={() => setViewMap(false)} />
      )}
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
        compareFloodRescue(a.member.qualifications, b.member.qualifications) ||
        a.member.lastName.localeCompare(b.member.lastName)
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
      compareCallsigns(a.member.callsign, b.member.callsign) || a.member.lastName.localeCompare(b.member.lastName)
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
