import { useAuth } from '../components/AuthContext';
import { filterAcceptsMember, MemberFilter, MemberFilterButton } from '../components/MemberFilter';
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
} from '../queries/availability';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { useHistory, useParams } from 'react-router-dom';

interface Params {
  week?: string;
}

const ManageMember: React.FC = () => {
  const params = useParams<Params>();
  const history = useHistory();
  const auth = useAuth();
  const unit = auth.unit!;

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const [filter, setFilter] = useState<MemberFilter>({ hideFlexibleAndSupport: true });

  const days = getDayIntervals(week);
  const visible = Interval.fromDateTimes(days[0].start, days[days.length - 1].end);

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        filter: { unit: unit.code },
        start: visible.start.toJSDate(),
        end: visible.end.toJSDate(),
      },
    },
  );

  const handleChangeWeek = (value: Interval) => {
    history.push(`/unit/storm/${value.start.toISODate()}`);
  };

  const teams: string[] = []; // data ? _.uniq(_.map(data.members, 'team')).sort() : undefined;
  const quals = data ? _.uniq(_.flatMap(data.members, 'qualifications')).sort() : undefined;

  return (
    <Page title='Storm'>
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
              <Spinner size='sm' animation='border' /> Loading unit availability&hellip;
            </Alert>
          );
        }

        if (error || !data) {
          return (
            <Alert variant='danger' className='m-3'> Error loading unit availability.</Alert>
          );
        }

        const members = data.members.filter(member => filterAcceptsMember(filter, member));

        return (
          <UnitTable
            interval={week}
            members={members}
            infoColumns={[
              {
                key: 'team',
                className: 'unit-table-team',
                heading: 'Team',
                render: (member) => (
                  null /* <TeamBadge team={member.team} /> */
                )
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
    </Page>
  );
};

export default ManageMember;
