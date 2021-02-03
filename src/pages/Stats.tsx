import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import { getWeekInterval } from '../model/dates'
import { FLEXIBLE_TEAMS, SUPPORT_TEAMS } from '../model/teams';
import { GET_STATISTICS_QUERY, GetStatisticsData, GetStatisticsVars } from '../queries/availability';

import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Area, AreaChart, Bar, BarChart, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

enum Type {
  STORM = 'STORM',
  VR = 'VR',
  FR = 'FR',
}

const Stats = () => {
  const week = getWeekInterval();
  const weekExpanded = Interval.fromDateTimes(week.start.startOf('day'), week.end.endOf('day'));

  const [interval, setInterval] = useState(weekExpanded);
  const [type, setType] = useState(Type.STORM);

  const auth = useAuth();
  const unit = auth.member!.unit;

  const { loading, error, data } = useQuery<GetStatisticsData, GetStatisticsVars>(
    GET_STATISTICS_QUERY,
    {
      variables: {
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
        unit: unit,
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
            { value: Type.VR, label: 'VR', variant: 'info' },
            { value: Type.FR, label: 'FR', variant: 'info' },
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

        const counts = data.statistics.counts.map(data => ({
          time: DateTime.fromISO(data.start).toMillis(),
          storm: data.storm,
          vr: data.vr,
          frInWater: data.frInWater.immediate,
          frOnWater: data.frOnWater.immediate,
          frOnLand: data.frOnLand.immediate,
        }));

        const teams = data.statistics.teams
          .filter(({ team }) => (
            !FLEXIBLE_TEAMS.includes(team) && !SUPPORT_TEAMS.includes(team)
          ))
          .map(data => ({
            name: data.team,
            enteredStorm: data.enteredStorm,
            missingStorm: data.members - data.enteredStorm,
            percentage: data.enteredStorm / data.members,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        // We copy the final value across to get the end to line up.
        counts.push({ ...counts[counts.length - 1], time: interval.end.toMillis() });

        return (
          <AutoSizer className='my-2'>
            {({ width }) => {
              const x = (
                <XAxis
                  dataKey='time'
                  type='number'
                  domain={[interval.start.toMillis(), interval.end.toMillis()]}
                  tickFormatter={(time: number) => DateTime.fromMillis(time).toLocaleString(DateTime.DATE_SHORT)}
                />
              );

              if (type === Type.FR) {
                return (
                  <LineChart width={width} height={500} data={counts}>
                    {x}
                    <YAxis />

                    <Legend />

                    <Line type='stepAfter' hide={type !== Type.FR} dataKey='frInWater' name='In water (L3)' stroke='#0d47a1' />
                    <Line type='stepAfter' hide={type !== Type.FR} dataKey='frOnWater' name='On water (L2)' stroke='#2196f3' />
                    <Line type='stepAfter' hide={type !== Type.FR} dataKey='frOnLand' name='Land based (L1)' stroke='#bbdefb' />
                  </LineChart>
                );
              }

              if (type === Type.VR) {
                return (
                  <AreaChart width={width} height={400} data={counts}>
                    {x}
                    <YAxis />
                    <Area type='stepAfter' dataKey='vr.immediate' stackId={1} fill='#d4edda' stroke='#155724' />
                    <Area type='stepAfter' dataKey='vr.support' stackId={1} fill='#fff3cd' stroke='#856404' />
                  </AreaChart>
                );
              }

              return (
                <>
                  <AreaChart width={width} height={400} data={counts}>
                    {x}
                    <YAxis />
                    <Area type='stepAfter' dataKey='storm' stroke='#004085' fill='#b8daff' />
                  </AreaChart>
                  <BarChart width={width} height={400} data={teams}>
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='enteredStorm' name='Entered Storm Availability' stackId={1} fill='#28a745' />
                    <Bar dataKey='missingStorm' name='Missing Storm Availability' stackId={1} fill='#dc3545' />
                  </BarChart>
                </>
              );
            }}
          </AutoSizer>
        );
      })()}
    </Page>
  );
};

export default Stats;
