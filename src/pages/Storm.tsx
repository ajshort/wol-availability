import { useAuth } from '../components/AuthContext';
import { filterAcceptsMember, MemberFilter, MemberFilterButton } from '../components/MemberFilter';
import Page from '../components/Page';
import WeekBrowser from '../components/WeekBrowser';
import UnitTable from '../components/UnitTable';
import { getWeekInterval, getIntervalPosition, TIME_ZONE } from '../model/dates';
import {
  GET_MEMBERS_AVAILABILITIES_QUERY,
  GetMembersAvailabilitiesData,
  GetMembersAvailabilitiesVars,
} from '../queries/availability';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { useHistory, useParams } from 'react-router-dom';

interface Params {
  week?: string;
}

const ManageMember: React.FC = () => {
  const params = useParams<Params>();
  const history = useHistory();
  const auth = useAuth();
  const me = auth.member!;

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const [filter, setFilter] = useState<MemberFilter>({ hideFlexibleAndSupport: true });

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        filter: { unit: me.unit },
        start: week.start.toJSDate(),
        end: week.end.toJSDate(),
      },
    },
  );

  const handleChangeWeek = (value: Interval) => {
    history.push(`/unit/storm/${value.start.toISODate()}`);
  };

  const teams = data ? _.uniq(data.members.map(member => member.team)).sort() : undefined;

  return (
    <Page title='Storm'>
      <div className='d-flex align-items-center justify-content-between border-bottom p-3'>
        <div>
          <MemberFilterButton id='storm-member-filter' teams={teams} value={filter} onChange={setFilter} />
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
            renderMember={(interval, member) => (
              member.availabilities.map(availability => {
                if (availability.storm === undefined) {
                  return null;
                }

                const left = getIntervalPosition(interval, DateTime.fromISO(availability.start));
                const right = getIntervalPosition(interval, DateTime.fromISO(availability.end));

                return (
                  <div
                    key={availability.start.toString()}
                    className={clsx('unit-table-availability-block', {
                      'availability-success': availability.storm === 'AVAILABLE',
                      'availability-danger': availability.storm === 'UNAVAILABLE',
                    })}
                    style={{
                      left: `${left * 100}%`,
                      right: `${(1 - right) * 100}%`,
                    }}
                  />
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
