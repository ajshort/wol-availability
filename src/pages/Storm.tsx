import Page from '../components/Page';
import WeekBrowser from '../components/WeekBrowser';
import UnitTable from '../components/UnitTable';
import { getWeekInterval, TIME_ZONE } from '../model/dates';
import {
  GET_MEMBERS_AVAILABILITIES_QUERY,
  GetMembersAvailabilitiesData,
  GetMembersAvailabilitiesVars,
} from '../queries/availability';

import { DateTime, Interval } from 'luxon';
import React from 'react';
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
        start: week.start.toJSDate(),
        end: week.end.toJSDate(),
      },
    },
  );

  const handleChangeWeek = (value: Interval) => {
    history.push(`/unit/storm/${value.start.toISODate()}`);
  };

  return (
    <Page title='Storm and Support'>
      <div className='d-flex align-items-center border-bottom p-3'>
        <WeekBrowser value={week} onChange={handleChangeWeek} />
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

        return <UnitTable interval={week} members={data.members} />;
      })()}
    </Page>
  );
};

export default ManageMember;
