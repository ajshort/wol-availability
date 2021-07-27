import { useAuth } from '../components/AuthContext';
import { filterAcceptsMember, MemberFilter, MemberFilterButton } from '../components/MemberFilter';
import MapModal from '../components/MapModal';
import Page from '../components/Page';
import TeamBadge from '../components/TeamBadge';
import WeekBrowser from '../components/WeekBrowser';
import UnitTable from '../components/UnitTable';
import { mergeAbuttingAvailabilities } from '../model/availability';
import { getWeekInterval, getDayIntervals, getIntervalPosition, TIME_ZONE } from '../model/dates';
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
import { FaMap } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';

interface Params {
  week?: string;
}

const Storm: React.FC = () => {
  const params = useParams<Params>();
  const history = useHistory();
  const { config } = useAuth();

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const [viewMap, setViewMap] = useState(false);
  const [filter, setFilter] = useState<MemberFilter>({ hideFlexibleAndSupport: true });

  const days = getDayIntervals(week);
  const visible = Interval.fromDateTimes(days[0].start, days[days.length - 1].end);

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        units: config.stormUnits,
        start: visible.start.toJSDate(),
        end: visible.end.toJSDate(),
      },
    },
  );

  const handleChangeWeek = (value: Interval) => {
    history.push(`/unit/storm/${value.start.toISODate()}`);
  };

  let members: MemberWithAvailabilityData[] = [];

  if (data) {
    members = data.units
      .flatMap(unit => unit.membersWithAvailabilities)
      .filter(member => filterAcceptsMember(filter, member));
  }

  const teams = new Set<string>();

  members.forEach(({ membership }) => {
    if (membership.team !== undefined) {
      teams.add(membership.team);
    }
  });

  const qualifications = Object.fromEntries(
    _.uniq(members.flatMap(member => member.member.qualifications)).map(qual => ([qual, qual]))
  );

  return (
    <Page title='Storm and Support' shortTitle='Storm'>
      <div className='d-flex align-items-center justify-content-between border-bottom p-3'>
        <div>
          <MemberFilterButton
            id='storm-member-filter'
            teams={Array.from(teams).sort()}
            qualifications={qualifications}
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
              <Spinner size='sm' animation='border' /> Loading unit availability&hellip;
            </Alert>
          );
        }

        if (error || !data) {
          return (
            <Alert variant='danger' className='m-3'> Error loading unit availability.</Alert>
          );
        }

        return (
          <UnitTable
            interval={week}
            members={members}
            infoColumns={[
              {
                key: 'team',
                className: 'unit-table-team',
                heading: 'Team',
                render: ({ membership }) => (
                  membership.team ? <TeamBadge team={membership.team} /> : null
                ),
              }
            ]}
            renderMember={(interval, member) => (
              mergeAbuttingAvailabilities(
                member.availabilities
                  .filter(({ storm }) => storm !== undefined)
                  .map(({ start, end, ...data }) => ({
                    interval: Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end)), ...data
                  }))
                  .sort((a, b) => a.interval.start.toMillis() - b.interval.start.toMillis()),
                ['storm', 'note'],
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
                      'availability-success': availability.storm === 'AVAILABLE',
                      'availability-danger': availability.storm === 'UNAVAILABLE',
                    })}
                    style={{
                      left: `${left * 100}%`,
                      right: `${(1 - right) * 100}%`,
                    }}
                  >
                    {availability.note && (
                      <Badge variant='secondary'>{availability.note}</Badge>
                    )}
                  </div>
                );
              })
            )}
            footers={[
              {
                title: members.length.toString(),
                included: (_, { storm }) => storm === 'AVAILABLE',
              },
            ]}
          />
        );
      })()}
      {viewMap && (
        <MapModal members={members} onHide={() => setViewMap(false)} />
      )}
    </Page>
  );
};

export default Storm;
