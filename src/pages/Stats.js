import * as palette from 'google-palette';
import gql from 'graphql-tag';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { withRouter } from 'react-router-dom';
import {
  DiscreteColorLegend,
  FlexibleWidthXYPlot,
  Hint,
  HorizontalGridLines,
  VerticalBarSeries,
  VerticalGridLines,
  XAxis,
  YAxis,
} from 'react-vis';
import _ from 'lodash';

import { SHIFTS, WEEK_START_DAY } from '../config';
import { FLEXIBLE_TEAMS, SUPPORT_TEAMS } from '../teams';
import { getDocumentTitle, getMemberShiftAvailability, getWeekEnd, getWeekStart } from '../utils';

const TEAM_COLOURS = {
  'Delta': '#81d4fa',
  'Oscar': '#aa66cc',
  'Romeo': '#00c851',
  'Sierra': '#f8bbd0',
  'Xray': '#ffcc80',
};

const AvailableGraph = ({ from, data }) => {
  const [tooltip, setTooltip] = useState(false);

  // Transform the data.
  const series = {};

  const teams = _.uniq(data.map(day => (
    Object.values(day).map(sums => Object.keys(sums)).flat()
  )).flat());

  for (const team of teams) {
    series[team] = {};

    for (const shift of SHIFTS) {
      series[team][shift] = [];
    }
  }

  for (let i = 0; i < data.length; ++i) {
    for (const team of teams) {
      for (const shift of SHIFTS) {
        let available = 0;

        if (_.has(data[i][shift], team)) {
          available = data[i][shift][team];
        }

        series[team][shift].push({
          team,
          shift,
          available,
          x: from.clone().add(i, 'days').format('ddd Do MMM'),
          y: available,
        });
      }
    }
  }

  // Generate a palette.
  const colours = palette('cb-Set1', teams.length);
  const teamColours = teams.reduce((res, team, i) => {
    res[team] = TEAM_COLOURS[team] || `#${colours[i]}`;
    return res;
  }, {});

  return (
    <FlexibleWidthXYPlot
      height={400}
      xType='ordinal'
      stackBy='y'
    >
      <DiscreteColorLegend
        orientation='horizontal'
        items={Object.keys(series).map(team => ({
          color: teamColours[team],
          title: team,
        }))}
        style={{ background: 'white', position: 'absolute', top: 10, right: 10 }}
      />
      <HorizontalGridLines />
      <XAxis />
      <YAxis />
      {Object.entries(series).map(([team, shifts]) => (
        SHIFTS.map(shift => {
          if (!(shift in shifts)) {
            return null;
          }

          return (
            <VerticalBarSeries
              color={teamColours[team]}
              cluster={shift}
              data={shifts[shift]}
              onValueMouseOver={value => setTooltip(value)}
              onValueMouseOut={() => setTooltip(false)}
            />
          );
        })
      ))}
      {tooltip ? <Hint value={tooltip} format={entry => ([
        { title: 'Team', value: entry.team },
        { title: 'Members Available', value: entry.available },
      ])} /> : null}
    </FlexibleWidthXYPlot>
  );
};

const EnteredGraph = ({ data }) => {
  const [tooltip, setTooltip] = useState(false);

  // Filter out any teams with less than 3 members, and flexible and support teams.
  data = Object.keys(data)
    .filter(team => !(FLEXIBLE_TEAMS.includes(team) || SUPPORT_TEAMS.includes(team)))
    .filter(team => (data[team].yes + data[team].no) > 3)
    .reduce((result, key) => (result[key] = data[key], result), {});

  const teams = Object.keys(data).sort();
  const yes = teams.map(team => ({ x: team, y: data[team].yes }));
  const no = teams.map(team => ({ x: team, y: data[team].no }));

  return (
    <FlexibleWidthXYPlot
      height={300}
      stackBy='y'
      xType='ordinal'
    >
      <VerticalGridLines />
      <HorizontalGridLines />
      <XAxis />
      <YAxis />
      <VerticalBarSeries
        color='#dc3545'
        data={no}
        onValueMouseOver={value => setTooltip(value)}
        onValueMouseOut={() => setTooltip(false)}
      />
      <VerticalBarSeries
        color='#28a745'
        data={yes}
        onValueMouseOver={value => setTooltip(value)}
        onValueMouseOut={() => setTooltip(false)}
      />
      {tooltip ? <Hint value={tooltip} format={entry => ([
        { title: 'Team', value: entry.x },
        { title: 'Entered', value: data[entry.x].yes },
        { title: 'Not entered', value: data[entry.x].no },
      ])} /> : null}
    </FlexibleWidthXYPlot>
  );
};

const MEMBER_AVAILABILITY_QUERY = gql`
  query ($from: Date!, $to: Date!) {
    members {
      team
      availabilities(from: $from, to: $to) {
        date
        shift
        available
      }
    }
  }
`;

const Stats = ({ match }) => {
  useEffect(() => {
    document.title = getDocumentTitle('Statistics');
  });

  let from;

  if (match.params.week !== undefined) {
    from = moment(match.params.week, 'YYYY-MM-DD');
  } else {
    from = getWeekStart();
  }

  // Check we actually have a valid start date.
  if (from.day() !== WEEK_START_DAY) {
    return <Alert variant='danger' className='m-3'>Invalid week start.</Alert>;
  }

  const to = getWeekEnd(from);
  const diff = to.diff(from, 'days');

  // Week links.
  const prevWeek = `/stats/${from.clone().subtract(1, 'week').format('YYYY-MM-DD')}`;
  const nextWeek = `/stats/${from.clone().add(1, 'week').format('YYYY-MM-DD')}`;

  return (
    <Container className='my-3'>
      <Query
        query={MEMBER_AVAILABILITY_QUERY}
        variables={{ from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD') }}
      >
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <Alert variant='info'>
                <Spinner animation='border' size='sm' /> Loading statistics&hellip;
              </Alert>
            );
          }

          if (error) {
            return <Alert variant='danger'>Error loading statistics.</Alert>;
          }

          // Sum availability across all days by team.
          const totals = [];

          for (let i = 0; i <= diff; ++i) {
            totals.push({ MORNING: {}, AFTERNOON: {}, NIGHT: {} });
          }

          let entered = {};

          for (const { team, availabilities } of data.members) {
            const avail = getMemberShiftAvailability(from, availabilities);

            const some = avail.some(({ shifts }) => shifts.some(({ available, enabled }) => (
              enabled && available !== undefined
            )));

            if (!(team in entered)) {
              entered[team] = { yes: 0, no: 0 };
            }

            if (some) {
              entered[team].yes++;
            } else {
              entered[team].no++;
            }

            for (const { date, shifts } of avail) {
              for (const { shift, available } of shifts) {
                if (!available) {
                  continue;
                }

                const offset = Math.ceil(moment(date, 'YYYY-MM-DD').diff(from, 'days', true));
                const entry = totals[offset][shift];

                if (!(team in entry)) {
                  entry[team] = 0;
                }

                entry[team]++;
              }
            }
          }

          return (
            <div className='text-center'>
              <h2 className='text-center'>Statistics</h2>
              <div className='d-flex align-items-center justify-content-center'>
                <LinkContainer to={prevWeek}>
                  <Button variant='link'><FaArrowLeft /> Previous week</Button>
                </LinkContainer>
                <span>Week of {from.format('Do MMM YYYY')}</span>
                <LinkContainer to={nextWeek}>
                  <Button variant='link'>Next week <FaArrowRight /></Button>
                </LinkContainer>
              </div>
              <p>
                The number of available members for each day and shift, clustered by team.
              </p>
              <AvailableGraph from={from} to={to} data={totals} />

              <h2>Entered Availability</h2>
              <p>
                A count of members who have <Badge variant='success'>entered availability</Badge>
                {' '} or <Badge variant='danger'>not entered availability</Badge> for each team.
              </p>
              <EnteredGraph data={entered} />
            </div>
          );
        }}
      </Query>
    </Container>
  );
}

export default withRouter(Stats);
