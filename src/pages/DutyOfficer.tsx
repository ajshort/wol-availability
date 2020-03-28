import WeekBrowser from '../components/WeekBrowser';
import { getDayIntervals, getWeekInterval } from '../model/dates';
import { getDocumentTitle } from '../utils';

import { DateTime, Interval } from 'luxon';
import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { FaUser } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';

interface TableProps {
  interval: Interval;
}

const Table: React.FC<TableProps> = ({ interval }) => {
  const days = getDayIntervals(interval);

  return (
    <div id='do-table'>
      {days.map(({ start }, index) => (
        <div className='day' key={index}>
          <div className='date'>
            {start.toLocaleString({ weekday: 'short', day: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  );
};

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
      <div className='p-3 d-flex border-bottom'>
        <Button variant='primary' className='mr-2'>
          <FaUser /> Set Duty Officer
        </Button>
        <WeekBrowser value={week} onChange={handleWeekChange} />
      </div>
      <Table interval={week} />
    </React.Fragment>
  )
};

export default DutyOfficer;
