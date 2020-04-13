import { getIntervalPosition } from '../model/dates';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import Measure, { ContentRect } from 'react-measure';

interface SelectionProps {
  bounds: Interval;
  interval: Interval;
}

const Selection: React.FC<SelectionProps> = ({ bounds, interval }) => {
  const { start, end } = interval;

  const left = `${100 * getIntervalPosition(bounds, interval.start)}%`;
  const right = `${100 * (1 - getIntervalPosition(bounds, interval.end))}%`;
  const style = { left, right };

  return (
    <div className='week-table-selection' style={style}>
      <span className='week-table-selection-start'>{start.toLocaleString(DateTime.TIME_24_SIMPLE)}</span>
      <span className='week-table-selection-end'>{end.toLocaleString(DateTime.TIME_24_SIMPLE)}</span>
    </div>
  );
};

export interface WeekTableProps {
  interval: Interval;
  children: (row: Interval) => React.ReactNode;
  selections?: Interval[];
  onChangeSelections?: (intervals: Interval[]) => void;
}

const WeekTable: React.FC<WeekTableProps> = props => {
  const { children, interval, selections, onChangeSelections } = props;

  // We split the interval into days, then make each day start at 6AM and finish at 6AM of the
  // next day.
  const rows = _
    .range(0, interval.count('days'))
    .map(i => interval.start.startOf('day').plus({ days: i }))
    .map(dt => Interval.fromDateTimes(dt.set({ hour: 6 }), dt.plus({ days: 1 }).set({ hour: 6 })));

  // Display each day as 4 columns. This used to switch dynamically.
  const columns = 4;
  const times = rows[0].divideEqually(columns);

  const handleSelect = (selected: Interval[]) => {
    if (!onChangeSelections) {
      return;
    }

    // If we've already selected all of them, de-select them. Otherwise select them.
    const existing = selections || [];
    const engulfed = selected.every(sel => (existing.some(container => container.engulfs(sel))));

    if (engulfed) {
      onChangeSelections(Interval.xor([...existing, ...selected]));
    } else {
      onChangeSelections(Interval.merge([...existing, ...selected]));
    }
  };

  const handleContainerClick = (row: Interval, e: React.MouseEvent<HTMLDivElement>) => {
    const { x, width } = e.currentTarget.getBoundingClientRect();
    const t = (e.clientX - x) / width;
    const index = Math.min(Math.floor((columns * t)), columns - 1);

    handleSelect([row.divideEqually(columns)[index]]);
  };

  const handleRowClick = (row: Interval) => {
    handleSelect([row]);
  };

  const handleColumnClick = (time: Interval) => {
    handleSelect(rows
      .map(row => {
        const base = (time.start.hour < 6) ? row.end : row.start;
        const start = base.set({ hour: time.start.hour });

        return Interval.fromDateTimes(start, start.plus({ hours: 24 / columns }))
      })
      .filter(selection => selection.overlaps(interval))
    );
  };

  const className = clsx({
    'week-table': true,
    'week-table-selectable': onChangeSelections !== undefined,
  });

  return (
    <Measure bounds>
      {({ measureRef }) => (
        <div className={className} ref={measureRef}>
          <div className='week-table-head'>
            {times.map((time, index) => (
              <div key={index} className='week-table-time' onClick={() => handleColumnClick(time)}>
                <small>{_.padStart(time.start.hour.toString(), 2, '0') + ':00'}</small>
              </div>
            ))}
          </div>
          {rows.map(row => (
            <div key={row.toString()} className='week-table-row'>
              <div className='week-table-date' onClick={() => handleRowClick(row)}>
                <span className='text-muted'>{row.start.toFormat('ccc')}</span>
                <span className='h5 mb-0'>{row.start.toFormat('d')}</span>
              </div>
              <div className='week-table-container' onClick={e => handleContainerClick(row, e)}>
                {times.map((_time, index) => (
                  <div
                    key={index}
                    className={clsx({
                      'week-table-hour': true,
                      'week-table-last-hour': (index === times.length - 1),
                    })}
                  />
                ))}
                {children(row)}
                {selections && selections.filter(sel => sel.overlaps(row)).map(sel => (
                  <Selection bounds={row} interval={sel} />
                ))}
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
      )}
    </Measure>
  );
};

export default WeekTable;
