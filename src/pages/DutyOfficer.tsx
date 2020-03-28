import WeekBrowser from '../components/WeekBrowser';
import { getDayIntervals, getWeekInterval, TIME_ZONE } from '../model/dates';
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
      <div className='gutter column'></div>
      {days.map((day, index) => (
        <div className='day column' key={index}>
          <div className='date'>
            {day.start.toLocaleString({ weekday: 'short', day: '2-digit' })}
          </div>
          <div className='day-container'>
            {day.divideEqually(24).map((hour, index) => (
              <div key={index} className='hour' />
            ))}
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
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  useEffect(() => {
    document.title = getDocumentTitle('Duty Officers');
  });

  const handleWeekChange = (value: Interval) => {
    history.replace(`/unit/do/${value.start.toISODate()}`);
  };

  return (
    <React.Fragment>
      <div className='p-3 border-bottom'>
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
