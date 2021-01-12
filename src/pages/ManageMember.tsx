import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import WeekBrowser from '../components/WeekBrowser';
import WeekTable from '../components/WeekTable';
import {
  Availability,
  AvailabilityInterval,
  StormAvailable,
  RescueAvailable,
} from '../model/availability';
import { getDayIntervals, getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';
import { VERTICAL_RESCUE, FLOOD_RESCUE } from '../model/qualifications';
import { useMutateMemberAvailability } from '../mutations/availability';
import {
  GET_MEMBER_AVAILABILITY_QUERY,
  GetMemberAvailabilityData,
  GetMemberAvailabilityVars,
} from '../queries/availability';

import { useQuery } from '@apollo/react-hooks';
import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge, { BadgeProps } from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Modal from 'react-bootstrap/Modal'
import Spinner from 'react-bootstrap/Spinner';
import { Typeahead } from 'react-bootstrap-typeahead';
import {
  FaBolt,
  FaCheck,
  FaCheckSquare,
  FaEllipsisV,
  FaExclamationTriangle,
  FaMinusSquare,
  FaSquare,
  FaTimes,
} from 'react-icons/fa';
import Form from 'react-bootstrap/Form';
import { useHistory, useParams } from 'react-router-dom';
import ReactSwipe from 'react-swipe';

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
  availabilities: AvailabilityInterval[];
  selections: Interval[];
  onChangeSelections: (value: Interval[]) => void;
  rescueMember?: boolean;
}

const AvailabilityRow: React.FC<AvailabilityRowProps> = props => {
  const { interval, availabilities, selections, onChangeSelections, rescueMember } = props;

  const handleClick = (clicked: Interval) => {
    const selected = selections.some(selection => selection.engulfs(clicked));

    if (selected) {
    } else {
    }

    if (selected) {
      onChangeSelections(Interval.xor([...selections, clicked]));
    } else {
      onChangeSelections(Interval.merge([...selections, clicked]));
    }
  };

  return (
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
          <div
            key={intersection.toString()}
            className={clsx(classes)}
            style={style}
            onClick={() => handleClick(intersection)}
          >
            {rescueMember && <RescueMemberBadges storm={storm} rescue={rescue} />}
            {vehicle && <Badge variant='info'>{vehicle}</Badge>}
            {note && <Badge variant='secondary'>{note}</Badge>}
          </div>
        );
      })}
    </React.Fragment>
  );
};

interface CoverVehicleModalProps {
  onHide: () => void;
  onSelect: (vehicle?: string) => void;
}

const CoverVehicleModal: React.FC<CoverVehicleModalProps> = ({ onHide, onSelect }) => {
  const [vehicle, setVehicle] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    onSelect(vehicle);
    onHide();

    e.preventDefault();
  };

  return (
    <Modal show onHide={onHide}>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Typeahead
            id='cover-vehicle-typeahead'
            allowNew
            autoFocus
            options={[
              'DPT56',
              'NIC19',
              'WOL43',
              'WOL56',
              'WOL57',
            ]}
            placeholder='Select vehicle...'
            selected={vehicle !== undefined ? [vehicle] : []}
            onChange={selected => setVehicle(selected.length > 0 ? selected[0] : undefined)}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant='secondary' onClick={onHide}>Cancel</Button>
          <Button variant='primary' type='submit'>Cover Vehicle</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

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

  const days = getDayIntervals(week);
  const visible = Interval.fromDateTimes(days[0].start, days[days.length - 1].end);

  const { loading, error, data } = useQuery<GetMemberAvailabilityData, GetMemberAvailabilityVars>(
    GET_MEMBER_AVAILABILITY_QUERY, {
      variables: {
        memberNumber: number,
        start: visible.start.toJSDate(),
        end: visible.end.toJSDate(),
      }
    }
  );

  const [mutate, { loading: mutating }] = useMutateMemberAvailability(number, visible);

  const [selections, setSelections] = useState<Interval[]>([]);
  const [selectingVehicle, setSelectingVehicle] = useState(false);

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

  const availabilities = member.availabilities.map(({ start, end, ...availability }) => {
    const interval = Interval.fromDateTimes(DateTime.fromISO(start), DateTime.fromISO(end));
    return { interval, ...availability } as AvailabilityInterval;
  });

  // Figure out if the member should be shown storm only mode, or rescue mode.
  const rescueQuals = [...VERTICAL_RESCUE, ...FLOOD_RESCUE];
  const rescueMember = member.qualifications.some(qual => rescueQuals.includes(qual));

  const handleChangeWeek = (value: Interval) => {
    setSelections([]);

    if (number === (auth.member as any).number) {
      history.push(`/member/me/${value.start.toISODate()}`);
    } else {
      history.push(`/member/${number}/${value.start.toISODate()}`);
    }
  };

  const setAvailabilities = (availabilities: AvailabilityInterval[]) => {
    // We expand the visible interval to encompass the beginning and end of any set intervals.
    let bounds = visible;

    for (const { interval: { start, end } } of availabilities) {
      if (start < bounds.start) {
        bounds = bounds.set({ start });
      }

      if (end > bounds.end) {
        bounds = bounds.set({ end });
      }
    }

    const promise = mutate({
      variables: {
        start: bounds.start.toJSDate(),
        end: bounds.end.toJSDate(),
        availabilities: [
          {
            memberNumber: number,
            availabilities: availabilities.map(({ interval, storm, rescue, vehicle, note }) => ({
              start: interval.start.toISO(),
              end: interval.end.toISO(),
              storm,
              rescue,
              vehicle,
              note,
            })),
          }
        ]
      },
    });

    // If they are a storm only member, there's no need to select again so clear their selection.
    if (!rescueMember) {
      promise.then(() => setSelections([]));
    }
  };

  const handleSet = (availability?: Availability) => {
    let updated = [...availabilities];

    // Go through each selection and split existing availabilities at the start and end.
    for (const selection of selections) {
      updated = updated.flatMap(value => (
        value.interval
          .splitAt(selection.start, selection.end)
          .map(split => {
            if (selection.engulfs(split)) {
              return ({ ...value, ...availability, interval: split });
            } else {
              return ({ ...value, interval: split });
            }
          })
      ));
    }

    // Create availabilities as required, or delete them if selected.
    if (availability !== undefined) {
      const existing = availabilities.map(({ interval }) => interval);
      const missing = selections.flatMap(selection => selection.difference(...existing));

      for (const interval of missing) {
        updated.push({ interval, ...availability });
      }
    } else {
      updated = updated.filter(({ interval }) => selections.some(selection => (
        !selection.engulfs(interval)
      )));
    }

    // Sort availabilities.
    updated.sort((a, b) => a.interval.start.toMillis() - b.interval.start.toMillis());

    // Merge adjacent equivalent availabilities.
    const merged: AvailabilityInterval[] = [];

    for (const value of updated) {
      const last = _.last(merged);
      const merge =
        last !== undefined &&
        last.interval.abutsStart(value.interval) &&
        _.isEqual(
          _.pickBy(_.pick(last, ['storm', 'rescue', 'vehicle', 'note']), _.identity),
          _.pickBy(_.pick(value, ['storm', 'rescue', 'vehicle', 'note']), _.identity),
        );

      if (merge) {
        merged[merged.length - 1].interval = last!.interval.set({ end: value.interval.end });
      } else {
        merged.push(value);
      }
    }

    setAvailabilities(merged);
  };

  const handleToggleClick = () => {
    if (selections.length === 0) {
      setSelections([week]);
    } else {
      setSelections([]);
    }
  };

  const toggle = (
    <Button variant='light' className='mr-2' onClick={handleToggleClick}>
      {(() => {
        if (mutating) {
          return <Spinner animation='border' size='sm' />;
        }

        if (selections.some(selection => selection.engulfs(week))) {
          return <FaCheckSquare />;
        } else if (selections.length > 0) {
          return <FaMinusSquare />;
        }

        return <FaSquare />;
      })()}
    </Button>
  );

  const storm = (
    <Dropdown>
      <Dropdown.Toggle
        variant='primary'
        id='storm-dropdown'
        className='mr-2'
        disabled={mutating || selections.length === 0}
      >
        <FaBolt /> <span className='d-none d-md-inline'>Storm</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => handleSet({ storm: 'AVAILABLE' })}>Available</Dropdown.Item>
        <Dropdown.Item onClick={() => handleSet({ storm: 'UNAVAILABLE' })}>Unavailable</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  const rescue = (
    <Dropdown>
      <Dropdown.Toggle
        variant='warning'
        id='rescue-dropdown'
        className='mr-2'
        disabled={mutating || selections.length === 0}
      >
        <FaExclamationTriangle /> <span className='d-none d-md-inline'>Rescue</span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => handleSet({ rescue: 'IMMEDIATE' })}>Immediate</Dropdown.Item>
        <Dropdown.Item onClick={() => handleSet({ rescue: 'SUPPORT' })}>Support</Dropdown.Item>
        <Dropdown.Item onClick={() => handleSet({ rescue: 'UNAVAILABLE' })}>Unavailable</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={() => setSelectingVehicle(true)}>Cover vehicle&hellip;</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  const more = (
    <Dropdown>
      <Dropdown.Toggle
        variant='light'
        id='more-dropdown'
        disabled={mutating || selections.length === 0}
      >
        <FaEllipsisV />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {/* <Dropdown.Item disabled>Save as my default</Dropdown.Item>
        <Dropdown.Item disabled>Set to my default</Dropdown.Item>
        <Dropdown.Divider /> */}
        <Dropdown.Item onClick={() => handleSet(undefined)}>Clear</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <Page title={member.fullName}>
      <div className='d-flex justify-content-between border-bottom p-3'>
        <div className='d-flex align-items-center'>
          {toggle}
          {rescueMember ? (
            <React.Fragment>
              {storm}
              {rescue}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button
                variant='success'
                className='mr-2'
                onClick={() => handleSet({ storm: 'AVAILABLE' })}
                disabled={mutating || selections.length === 0}
              >
                <FaCheck /> <span className='d-none d-md-inline'>Available</span>
              </Button>
              <Button
                variant='danger'
                className='mr-2'
                onClick={() => handleSet({ storm: 'UNAVAILABLE' })}
                disabled={mutating || selections.length === 0}
              >
                <FaTimes /> <span className='d-none d-md-inline'>Unavailable</span>
              </Button>
            </React.Fragment>
          )}
          {more}
        </div>
        <div className='d-none d-md-flex align-items-center'>
          <WeekBrowser value={week} onChange={handleChangeWeek} />
        </div>
      </div>
      <ReactSwipe>
        <WeekTable interval={week} selections={selections} onChangeSelections={setSelections}>
          {row => (
            <AvailabilityRow
              key={row.toString()}
              interval={row}
              availabilities={availabilities}
              selections={selections}
              onChangeSelections={setSelections}
              rescueMember={rescueMember}
            />
          )}
        </WeekTable>
      </ReactSwipe>
      {selectingVehicle && (
        <CoverVehicleModal
          onSelect={vehicle => handleSet({ vehicle })}
          onHide={() => setSelectingVehicle(false)}
        />
      )}
    </Page>
  );
};

export default ManageMember;
