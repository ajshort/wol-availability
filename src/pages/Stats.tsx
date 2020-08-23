import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import { calculateMinimumAvailabilities } from '../model/availability';
import { getWeekInterval } from '../model/dates'
import {
  GET_MEMBERS_AVAILABILITIES_QUERY,
  GetMembersAvailabilitiesVars,
  GetMembersAvailabilitiesData,
} from '../queries/availability';

import _ from 'lodash';
import { Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

enum Type {
  STORM,
  VR,
  FR,
};

const Stats = () => {
  const [interval, setInterval] = useState(getWeekInterval());
  const [type, setType] = useState(Type.STORM);

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        start: interval.start.toJSDate(),
        end: interval.end.toJSDate(),
      },
    },
  );

  const handleChangeType = (value: Type | undefined) => {
    if (value !== undefined) {
      setType(value);
    }
  };

  return (
    <Page title='Statistics'>
      <div className='d-flex align-items-center justify-content-between border-bottom p-3'>
        <RadioButtonGroup<Type>
          options={[
            { value: Type.STORM, label: 'Storm', variant: 'info' },
            { value: Type.VR, label: 'VR', variant: 'info' },
            { value: Type.FR, label: 'FR', variant: 'info' },
          ]}
          value={type}
          onChange={handleChangeType}
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

        // We filter to relevant members based on type.
        switch (type) {
          case Type.VR:
            break;

          case Type.FR:
            break;

          case Type.STORM:
          default:
            break;
        }

        // Batch up the minimum availability at 30 minute intervals.
        const buckets = interval.splitBy({ minutes: 30 });
        const counts = calculateMinimumAvailabilities(
          buckets, data.members, (member, { storm }) => storm === 'AVAILABLE'
        );

        const chart = _.zip(buckets, counts).map(([interval, count]) => ({
          interval,
          count,
        }));

        return (
          <AutoSizer>
            {({ width }) => (
              <AreaChart
                width={width}
                height={500}
                data={chart}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey='interval'
                  tickFormatter={(interval: Interval) => interval}
                />
                <YAxis />
                <Tooltip />
                <Area type='monotone' dataKey='count' stackId={1} stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            )}
          </AutoSizer>
        );
      })()}
    </Page>
  );
};

export default Stats;
