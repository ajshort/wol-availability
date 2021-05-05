import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import { getWeekInterval } from '../model/dates'
import { VERTICAL_RESCUE } from '../model/qualifications';
import { FLEXIBLE_TEAMS, SUPPORT_TEAMS } from '../model/teams';
import { GET_STATISTICS_QUERY, GetStatisticsData, GetStatisticsVars } from '../queries/availability';

import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Area, AreaChart, Bar, BarChart, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';

enum Type {
  STORM = 'STORM',
  VR = 'VR',
  FR = 'FR',
}

const Stats = () => {
  const week = getWeekInterval();

  const [interval, setInterval] = useState(week);
  const [type, setType] = useState(Type.STORM);

  const auth = useAuth();
  const unit = auth.unit!;

  const { loading, error, data } = useQuery<GetStatisticsData, GetStatisticsVars>(
    GET_STATISTICS_QUERY,
    {
      variables: {
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
        unit,
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
          dateFormat='cccc do MMM yyyy HH:mm'
          className='form-control'
        />
        <span className='mx-2'>to</span>
        <DatePicker
          selected={interval.end.toJSDate()}
          onChange={handleSetTo}
          minDate={interval.start.toJSDate()}
          showTimeSelect
          dateFormat='cccc do MMM yyyy HH:mm'
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

        const formatDays = (seconds: any) => (seconds / (24 * 60 * 60)).toLocaleString();

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

              const tooltip = (
                <Tooltip labelFormatter={val => DateTime.fromMillis(val as number).toLocaleString(DateTime.DATETIME_SHORT)} />
              );

              if (type === Type.FR) {
                return (
                  <LineChart width={width} height={500} data={counts}>
                    {x}
                    <YAxis />
                    {tooltip}
                    <Legend />
                    <Line type='stepAfter' dataKey='frInWater' name='In water (L3)' stroke='#0d47a1' />
                    <Line type='stepAfter' dataKey='frOnWater' name='On water (L2)' stroke='#2196f3' />
                    <Line type='stepAfter' dataKey='frOnLand' name='Land based (L1)' stroke='#bbdefb' />
                  </LineChart>
                );
              }

              if (type === Type.VR) {
                const vr = data.statistics.members
                  .filter(({ member }) => member.qualifications.includes(VERTICAL_RESCUE))
                  .sort((a, b) => (b.rescueImmediate - a.rescueImmediate) || (b.rescueSupport - a.rescueSupport));

                return (
                  <>
                    <AreaChart width={width} height={400} data={counts}>
                      {x}
                      <YAxis />
                      {tooltip}
                      <ReferenceLine y={2} stroke='#dc3545' />
                      <ReferenceLine y={3} stroke='#ffc107' />
                      <Area type='stepAfter' dataKey='vr.immediate' name='Immediate' stackId={1} fill='#d4edda' stroke='#155724' />
                      <Area type='stepAfter' dataKey='vr.support' name='Support' stackId={1} fill='#fff3cd' stroke='#856404' />
                    </AreaChart>
                    {/* {permission === 'EDIT_UNIT' && ( */}
                      <BarChart width={width} height={32 * vr.length} data={vr} layout='vertical'>
                        <XAxis type='number' tickFormatter={formatDays} domain={[0, interval.count('days')]} />
                        <YAxis type='category' dataKey='member.fullName' width={180} />
                        <Tooltip formatter={formatDays} />
                        <Bar dataKey='rescueImmediate' name='Immediate' stackId={1} fill='#28a745' />
                        <Bar dataKey='rescueSupport' name='Support' stackId={1} fill='#ffc658' />
                      </BarChart>
                    {/* )} */}
                  </>
                );
              }

              return (
                <>
                  <AreaChart width={width} height={400} data={counts}>
                    {x}
                    <YAxis />
                    {tooltip}
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
