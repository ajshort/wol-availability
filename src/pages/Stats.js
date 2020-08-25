import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import { calculateMinimumAvailabilities } from '../model/availability';
import { getWeekInterval } from '../model/dates'
import { GET_MEMBERS_AVAILABILITIES_QUERY } from '../queries/availability';

import _ from 'lodash';
import { DateTime } from 'luxon';
import { Index, TimeRange, TimeSeries } from 'pondjs';
import React, { useState } from 'react';
import { useQuery } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import { AreaChart, Charts, ChartContainer, ChartRow, YAxis } from 'react-timeseries-charts';
import AutoSizer from 'react-virtualized-auto-sizer';


const Stats = () => {
  const [interval, setInterval] = useState(getWeekInterval());
  const [type, setType] = useState('STORM');

  const { loading, error, data } = useQuery(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
      },
    },
  );

  const handleChangeType = value => {
    if (value !== undefined) {
      setType(value);
    }
  };

  const handleSetFrom = from => {
    if (from !== undefined) {
      setInterval(interval.set({ start: DateTime.fromJSDate(from) }));
    }
  };

  const handleSetTo = to => {
    if (to !== undefined) {
      setInterval(interval.set({ end: DateTime.fromJSDate(to) }));
    }
  };

  return (
    <Page title='Statistics'>
      <div className='d-flex align-items-center border-bottom p-3'>
        <RadioButtonGroup
          options={[
            { value: 'STORM', label: 'Storm', variant: 'info' },
            { value: 'VR', label: 'VR', variant: 'info' },
            { value: 'FR', label: 'FR', variant: 'info' },
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
          dateFormat='dd/MM/yyyy'
          className='form-control'
        />
        <span className='mx-2'>to</span>
        <DatePicker
          selected={interval.end.toJSDate()}
          onChange={handleSetTo}
          minDate={interval.start.toJSDate()}
          showTimeSelect
          dateFormat='dd/MM/yyyy'
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

        // Batch up the minimum availability at 30 minute intervals.
        const buckets = interval.splitBy({ minutes: 30 });
        const counts = calculateMinimumAvailabilities(
          buckets, data.members, (member, { storm }) => storm === 'AVAILABLE'
        );

        const points = _
          .zip(buckets, counts)
          .map(([bucket, count]) => [Index.getIndexString('1h', bucket.start.toJSDate()), count]);

        const range = new TimeRange(interval.start.toJSDate(), interval.end.toJSDate());
        const series = new TimeSeries({
          name: 'availability',
          columns: ['index', 'available'],
          points,
        });

        return (
          <AutoSizer className='my-2'>
            {({ width }) => (
              <ChartContainer timeRange={range} width={width}>
                <ChartRow height={400}>
                  <YAxis
                    id='y'
                    min={0}
                    max={_.max(counts)}
                    width={60}
                    type='linear'
                  />
                  <Charts>
                    <AreaChart
                      axis='y'
                      series={series}
                    />
                  </Charts>
                </ChartRow>
              </ChartContainer>
            )}
          </AutoSizer>
        );
      })()}
    </Page>
  );
};

export default Stats;
