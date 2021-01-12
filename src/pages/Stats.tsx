import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import { getWeekInterval } from '../model/dates'
import { GET_STATISTICS_QUERY, GetStatisticsData, GetStatisticsVars } from '../queries/availability';

import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

enum Type {
  STORM,
  VR,
  FR,
}

const Stats = () => {
  const [interval, setInterval] = useState(getWeekInterval());
  const [type, setType] = useState(Type.STORM);

  const { loading, error, data } = useQuery<GetStatisticsData, GetStatisticsVars>(
    GET_STATISTICS_QUERY,
    {
      variables: {
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
      },
    },
  );

  const handleChangeType = (value?: Type) => {
    if (value !== undefined) {
      setType(value);
    }
  };

  const handleSetFrom = (from: Date | null) => {
    if (from) {
      setInterval(interval.set({ start: DateTime.fromJSDate(from) }));
    }
  };

  const handleSetTo = (to: Date | null) => {
    if (to) {
      setInterval(interval.set({ end: DateTime.fromJSDate(to) }));
    }
  };

  return (
    <Page title='Statistics'>
      <div className='d-flex align-items-center border-bottom p-3'>
        <RadioButtonGroup<Type>
          options={[
            { value: Type.STORM, label: 'Storm', variant: 'info' },
          ]}
          value={type}
          onChange={handleChangeType}
        />
        <span className='mx-2'>from</span>
        <DatePicker
          selected={interval.start.toJSDate()}
          onChange={handleSetFrom}
          maxDate={interval.end.toJSDate()}
          showTimeSelect
          className='form-control'
        />
        <span className='mx-2'>to</span>
        <DatePicker
          selected={interval.end.toJSDate()}
          onChange={handleSetTo}
          minDate={interval.start.toJSDate()}
          showTimeSelect
          className='form-control'
        />
      </div>
      {(() => {
        if (loading) {
          return (
            <Alert variant='info' className='m-3'>
              <Spinner size='sm' animation='border' /> Loading statistics&hellip;
            </Alert>
          );
        }

        if (error || !data) {
          return (
            <Alert variant='danger' className='m-3'> Error loading statistics.</Alert>
          );
        }

        const counts = data.statistics.counts.map(
          ({ start, end, storm }) => ({
            time: DateTime.fromISO(start).toMillis(), storm,
          })
        );

        // We copy the final value across to get the end to line up.
        counts.push({ ...counts[counts.length - 1], time: interval.end.toMillis() });

        return (
          <AutoSizer className='my-2'>
            {({ width }) => (
              <AreaChart width={width} height={500} data={counts}>
                <XAxis
                  dataKey='time'
                  type='number'
                  domain={[interval.start.toMillis(), interval.end.toMillis()]}
                  tickFormatter={(time: number) => DateTime.fromMillis(time).toLocaleString(DateTime.DATE_SHORT)}
                />
                <YAxis />
                <Area type='stepAfter' dataKey='storm' stroke='#004085' fill='#b8daff' />
              </AreaChart>
            )}
          </AutoSizer>
        );
      })()}
    </Page>
  );
};

export default Stats;
