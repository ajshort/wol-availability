import _ from 'lodash';
import { Duration, Interval } from 'luxon';
import React from 'react';
import { getIntervalPosition } from '../model/dates';

export interface WeekTableProps {
  interval: Interval;
  children: (row: Interval) => React.ReactNode;
}

const WeekTable: React.FC<WeekTableProps> = ({ children, interval }) => {
  // We split the interval into days, then make each day start at 6AM and finish at 6AM of the
  // next day.
  const rows = _
    .range(0, interval.count('days'))
    .map(i => interval.start.startOf('day').plus({ days: i }))
    .map(dt => Interval.fromDateTimes(dt.set({ hour: 6 }), dt.plus({ days: 1 }).set({ hour: 6 })));

  const times = rows[0].splitBy(Duration.fromObject({ hours: 2 }));

  return (
    <div className='week-table'>
      <div className='week-table-head'>
        {times.map((time, index) => (
          <div key={index} className='week-table-time'>
            <small>{_.padStart(time.start.hour.toString(), 2, '0') + ':00'}</small>
          </div>
        ))}
      </div>
      {rows.map(row => (
        <div key={row.toString()} className='week-table-row'>
          <div className='week-table-date'>
            <span className='text-muted'>{row.start.toFormat('ccc')}</span>
            <span className='h5 mb-0'>{row.start.toFormat('d')}</span>
          </div>
          <div className='week-table-container'>
            {_.range(0, 24).map(hour => (
              <div key={hour} className='week-table-hour' />
            ))}
            {children(row)}
            {(interval.start > row.start) && (
              <div
                className='week-table-bound'
                style={{ left: 0, width: (100 * getIntervalPosition(row, interval.start)) + '%' }}
              />
            )}
            {(interval.end < row.end) && (
              <div
                className='week-table-bound'
                style={{ right: 0, width: (100 * (1 - getIntervalPosition(row, interval.end))) + '%' }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeekTable;
