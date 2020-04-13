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
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FaBolt, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
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

interface AvailabilityModalProps {
  onHide: () => void;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ onHide }) => {
  const [availability, setAvailability] = useState<AvailabilityWithoutInterval>({ });
  const enabled = (availability.storm !== undefined || availability.rescue !== undefined);

  return (
    <Modal show={true} onHide={onHide}>
      <Modal.Body>
        <Form>
          <Form.Group controlId='storm'>
            <Form.Label>Storm and support</Form.Label>
            <div>
              <RadioButtonGroup<StormAvailable>
                options={[
                  { value: 'AVAILABLE', label: 'Available', variant: 'success'},
                  { value: 'UNAVAILABLE', label: 'Unavailable', variant: 'danger'},
                ]}
                value={availability.storm}
                onChange={storm => setAvailability({ ...availability, storm })}
              />
            </div>
          </Form.Group>
          <Form.Group controlId='rescue'>
            <Form.Label>Rescue</Form.Label>
            <div>
              <RadioButtonGroup<RescueAvailable>
                options={[
                  { value: 'IMMEDIATE', label: 'Immediate', variant: 'success'},
                  { value: 'SUPPORT', label: 'Support', variant: 'warning'},
                  { value: 'UNAVAILABLE', label: 'Unavailable', variant: 'danger'},
                ]}
                value={availability.rescue}
                onChange={rescue => setAvailability({ ...availability, rescue })}
              />
            </div>
          </Form.Group>
          <Form.Group controlId='note'>
            <Form.Label>Note</Form.Label>
            <Form.Control
              type='text'
              value={availability.note || ''}
              onChange={(e: React.FormEvent<FormControlProps>) => {
                setAvailability({ ...availability, note: e.currentTarget.value })
              }}
            />
          </Form.Group>
          <Form.Group controlId='vehicle'>
            <Form.Label>Covering vehicle</Form.Label>
            <Form.Control as='select' className='custom-select'>
              <option></option>
              <option>NIC19</option>
              <option>WOL43</option>
              <option>WOL32</option>
              <option>WOL33</option>
              <option>WOL39</option>
              <option>WOL55</option>
              <option>WOL56</option>
              <option>WOL57</option>
            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={onHide}>Close</Button>
        <Button variant='primary' disabled={!enabled}>Set Availability</Button>
      </Modal.Footer>
    </Modal>
  )
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

  const handleChangeWeek = (value: Interval) => {
    if (number === (auth.member as any).number) {
      history.push(`/member/me/${value.start.toISODate()}`);
    } else {
      history.push(`/member/${number}/${value.start.toISODate()}`);
    }
  };

  const [editing, setEditing] = useState(false);
  const [selections, setSelections] = useState<Interval[]>([]);

  // TODO the setter should merge together adjacent equivalent availabilities.
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  // Handlers to set the entirety of a week to some field.
  const handleSetWeek = (set: { storm?: StormAvailable, rescue?: RescueAvailable }) => {
    const updated = availabilities.map(availability => ({ ...availability, ...set }));
    const missing = Interval.xor([week, ...updated.map(a => a.interval)]);
    const added = missing.map(interval => ({ interval, ...set }));

    // TODO this shouldn't apply to existing intervals outside the week. It may need to split ones
    // which cross week boundaries.

    setAvailabilities([...updated, ...added]);
  };

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

        return (
          <Page title={member.fullName}>
            <div className='d-flex align-items-center border-bottom p-3'>
              <Button
                variant='primary'
                className='mr-2'
                disabled={selections.length === 0}
                onClick={() => setEditing(true)}
              >
                <FaPlus /> Set Availability
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant='info' id='week-dropdown' className='mr-2'>
                  Week
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>Storm and Support</Dropdown.Header>
                  <Dropdown.Item onClick={() => handleSetWeek({ storm: 'AVAILABLE'})}>Set available</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSetWeek({ storm: 'UNAVAILABLE'})}>Set unavailable</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Header>Rescue</Dropdown.Header>
                  <Dropdown.Item onClick={() => handleSetWeek({ rescue: 'IMMEDIATE'})}>Set immediate</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSetWeek({ rescue: 'SUPPORT'})}>Set support</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleSetWeek({ rescue: 'UNAVAILABLE'})}>Set unavailable</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <WeekBrowser value={week} onChange={handleChangeWeek} />
            </div>
            <WeekTable interval={week} selections={selections} onChangeSelections={setSelections}>
              {row => <AvailabilityRow interval={row} availabilities={availabilities} rescueMember />}
            </WeekTable>
            {editing && (
              <AvailabilityModal onHide={() => setEditing(false)} />
            )}
          </Page>
        );
      }}
    </Query>
  );
};

export default ManageMember;
