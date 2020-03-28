import WeekBrowser from '../components/WeekBrowser';
import { getWeekInterval } from '../model/dates';
import { getDocumentTitle } from '../utils';

import { DateTime, Interval } from 'luxon';
import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

interface Params {
  week?: string;
}

const DutyOfficer: React.FC = () => {
  const history = useHistory();
  const params = useParams<Params>();

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week));
  }

  useEffect(() => {
    document.title = getDocumentTitle('Duty Officers');
  });

  const handleWeekChange = (value: Interval) => {
    history.replace(`/unit/do/${value.start.toISODate()}`);
  };

  return (
    <React.Fragment>
      <div className='p-2'>
        <WeekBrowser value={week} onChange={handleWeekChange} />
      </div>
    </React.Fragment>
  )
};

export default DutyOfficer;
