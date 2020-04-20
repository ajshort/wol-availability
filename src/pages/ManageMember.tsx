import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import WeekBrowser from '../components/WeekBrowser';
import WeekTable from '../components/WeekTable';
import {
  Availability,
  AvailabilityWithoutInterval,
  StormAvailable,
  RescueAvailable,
} from '../model/availability';
import { getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';

import gql from 'graphql-tag';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Badge, { BadgeProps } from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import { FormControlProps } from 'react-bootstrap/FormControl';
import Spinner from 'react-bootstrap/Spinner';
import { FaBolt, FaExclamationTriangle, FaPlus, FaCheckSquare } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import clsx from 'clsx';

const GET_MEMBER_QUERY = gql`
  query ($number: Int!) {
    member(number: $number) {
      fullName
    }
  }
`;

interface MemberData {
  fullName: string;
}

interface GetMemberData {
  member: MemberData | null;
}

interface RescueMemberBadgesProps {
  storm?: StormAvailable;
  rescue?: RescueAvailable;
}

const RescueMemberBadges: React.FC<RescueMemberBadgesProps> = ({ storm, rescue }) => {
  const both = (
    <React.Fragment>
      <span className='d-md-none'><FaBolt /> <FaExclamationTriangle /></span>
      <span className='d-none d-md-inline'>Storm and rescue</span>
    </React.Fragment>
  );

  if (storm === 'AVAILABLE' && rescue === 'IMMEDIATE') {
    return <Badge variant='success' className='mr-1'>{both}</Badge>;
  }

  if (storm === 'UNAVAILABLE' && rescue === 'UNAVAILABLE') {
    return <Badge variant='danger' className='mr-1'>{both}</Badge>;
  }

  if (storm === undefined && rescue === undefined) {
    return <Badge variant='secondary' className='mr-1'>{both}</Badge>;
  }

  let stormVariant: BadgeProps['variant'] = 'secondary';
  let rescueVariant: BadgeProps['variant'] = 'secondary';

  if (storm === 'AVAILABLE') {
    stormVariant = 'success';
  } else if (storm === 'UNAVAILABLE') {
    stormVariant = 'danger';
  }

  if (rescue === 'IMMEDIATE') {
    rescueVariant = 'success';
  } else if (rescue === 'SUPPORT') {
    rescueVariant = 'warning';
  } else if (rescue === 'UNAVAILABLE') {
    rescueVariant = 'danger';
  }

  return (
    <React.Fragment>
      <Badge variant={stormVariant} className='mr-1'>
        <span className='d-md-none'><FaBolt /></span>
        <span className='d-none d-md-inline'>Storm</span>
      </Badge>
      <Badge variant={rescueVariant} className='mr-1'>
        <span className='d-md-none'><FaExclamationTriangle /></span>
        <span className='d-none d-md-inline'>Rescue</span>
      </Badge>
    </React.Fragment>
  );
};

interface AvailabilityRowProps {
  interval: Interval;
  availabilities: Availability[];
  rescueMember?: boolean;
}

const AvailabilityRow: React.FC<AvailabilityRowProps> = ({ interval, availabilities, rescueMember }) => (
  <React.Fragment>
    {availabilities.filter(a => a.interval.overlaps(interval)).map(availability => {
      const { storm, rescue, note, vehicle } = availability;
      const intersection = availability.interval.intersection(interval)!;

      const l = getIntervalPosition(interval, intersection.start);
      const r = 1 - getIntervalPosition(interval, intersection.end);
      const style = { left: `${100 * l}%`, right: `${100 * r}%` };

      // If we're a rescue member, we require both to be green to go green and vice versa for red.
      // Otherwise we just go yellow. For non-rescue members, just use the colour of the storm
      // availability.
      const classes = ['availability-block'];

      if ((!rescueMember || rescue === 'IMMEDIATE') && storm === 'AVAILABLE') {
        classes.push('availability-success');
      } else if ((!rescueMember || rescue === 'UNAVAILABLE') && storm === 'UNAVAILABLE') {
        classes.push('availability-danger');
      } else {
        classes.push('availability-warning');
      }

      return (
        <div className={clsx(classes)} style={style}>
          {rescueMember && <RescueMemberBadges storm={storm} rescue={rescue} />}
          {vehicle && <Badge variant='info'>{vehicle}</Badge>}
          {note && <Badge variant='secondary'>{note}</Badge>}
        </div>
      );
    })}
  </React.Fragment>
);

interface Params {
  member: string;
  week?: string;
}

const ManageMember: React.FC = () => {
  const auth = useAuth();
  const params = useParams<Params>();
  const history = useHistory();

  let number: number;

  if (params.member === 'me') {
    number = (auth.member as any).number;
  } else {
    number = parseInt(params.member, 10);
  }

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const [selections, setSelections] = useState<Interval[]>([]);

  // TODO the setter should merge together adjacent equivalent availabilities.
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const handleChangeWeek = (value: Interval) => {
    setSelections([]);

    if (number === (auth.member as any).number) {
      history.push(`/member/me/${value.start.toISODate()}`);
    } else {
      history.push(`/member/${number}/${value.start.toISODate()}`);
    }
  };

  const handleSet = (availability: AvailabilityWithoutInterval) => {
    let updated = [...availabilities];

    // TODO update existing availabilities.
    for (const selection of selections) {
      // Update any fully engulfed existing availabilities.
      updated
        .filter(({ interval }) => selection.engulfs(interval))
        .forEach(entry => entry = { interval: entry.interval, ...availability });
    }

    // Create availabilities as required.
    const missing = Interval.xor([...selections, ...updated.map(a => a.interval)]);

    for (const interval of missing) {
      updated.push({ interval, ...availability });
    }

    setAvailabilities(updated);
  };

  // // Handlers to set the entirety of a week to some field.
  // const handleSet = (set: { storm?: StormAvailable, rescue?: RescueAvailable }) => {
  //   const updated = availabilities.map(availability => ({ ...availability, ...set }));
  //   const missing = Interval.xor([week, ...updated.map(a => a.interval)]);
  //   const added = missing.map(interval => ({ interval, ...set }));

  //   // TODO this shouldn't apply to existing intervals outside the week. It may need to split ones
  //   // which cross week boundaries.

  //   setAvailabilities([...updated, ...added]);
  //   setSelections([]);
  // };

  // // Sets the availability for the currently selected intervals.
  // const handleSubmit = (data: AvailabilityWithoutInterval) => {
  //   let updated = availabilities;

  //   for (const selection of selections) {
  //     // Filter any fully overlapped values.
  //     updated = updated.filter(({ interval }) => !selection.engulfs(interval));

  //     // If an existing range fully engulfs this, update the engulfer to abut this, and then
  //     // copy it after.
  //     const engulfing = updated.find(({ interval }) => interval.engulfs(selection));

  //     if (engulfing) {
  //       updated.push({ ...engulfing, interval: engulfing.interval.set({ start: selection.end }) });
  //       engulfing.interval = engulfing.interval.set({ end: selection.start });
  //     }

  //     // Update an existing range which overlaps the start of this range.
  //     const start = updated.find(({ interval }) => selection.contains(interval.end));

  //     if (start) {
  //       start.interval = start.interval.set({ end: selection.start });
  //     }

  //     // Update an existing range which overlaps the end of this range.
  //     const end = updated.find(({ interval }) => selection.contains(interval.start));

  //     if (end) {
  //       end.interval = end.interval.set({ start: selection.end });
  //     }

  //     // Then push the actual value.
  //     updated.push({ interval: selection, ...data });
  //   }

  //   setAvailabilities(updated);
  //   setSelections([]);
  // }

  return (
    <Query<GetMemberData> query={GET_MEMBER_QUERY} variables={{ number }}>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <Page title='Member'>
              <Alert variant='info' className='m-3'>
                <Spinner size='sm' animation='border' /> Loading member&hellip;
              </Alert>
            </Page>
          );
        }

        if (error || !data || !data.member) {
          return (
            <Page title='Member'>
              <Alert variant='danger' className='m-3'> Error loading member.</Alert>
            </Page>
          );
        }

        const { member } = data;

        const storm = (
          <Dropdown>
            <Dropdown.Toggle
              variant='primary'
              id='storm-dropdown'
              className='mr-2'
              disabled={selections.length === 0}
            >
              <FaBolt /> Storm and Support
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleSet({ storm: 'AVAILABLE'})}>Available</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSet({ storm: 'UNAVAILABLE'})}>Unavailable</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        );

        const rescue = (
          <Dropdown>
            <Dropdown.Toggle
              variant='warning'
              id='rescue-dropdown'
              className='mr-2'
              disabled={selections.length === 0}
            >
              <FaExclamationTriangle /> Rescue
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleSet({ rescue: 'IMMEDIATE'})}>Immediate</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSet({ rescue: 'SUPPORT'})}>Support</Dropdown.Item>
              <Dropdown.Item onClick={() => handleSet({ rescue: 'UNAVAILABLE'})}>Unavailable</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        );

        const note = (
          <Button
            variant='info'
            className='mr-2'
            disabled={selections.length === 0}
          >
            <FaPlus /> Note
          </Button>
        );

        return (
          <Page title={member.fullName}>
            <div className='d-flex justify-content-between border-bottom p-3'>
              <div className='d-flex align-items-center'>
                {storm}
                {rescue}
                {note}
              </div>
              <div className='d-flex align-items-center'>
                <WeekBrowser value={week} onChange={handleChangeWeek} />
              </div>
            </div>
            <WeekTable interval={week} selections={selections} onChangeSelections={setSelections}>
              {row => <AvailabilityRow interval={row} availabilities={availabilities} rescueMember />}
            </WeekTable>
          </Page>
        );
      }}
    </Query>
  );
};

export default ManageMember;
