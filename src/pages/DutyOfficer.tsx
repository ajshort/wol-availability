import MemberSelector from '../components/MemberSelector';
import RadioButtonGroup from '../components/RadioButtonGroup';
import WeekBrowser from '../components/WeekBrowser';
import { Shift } from '../model/availability';
import { getDayIntervals, getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';
import { getDocumentTitle } from '../utils';

import gql from 'graphql-tag';
import { DateTime, Interval } from 'luxon';
import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import { FaUser } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import { Query } from 'react-apollo';

interface EditModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

const EditModal: React.FC<EditModalProps> = ({ show, setShow }) => {
  const onHide = () => setShow(false);

  const [shift, setShift] = useState<Shift | undefined>(Shift.DAY);
  const [member, setMember] = useState<number | undefined>(undefined);

  const currentWeek = getWeekInterval();
  const [start, setStart] = useState<DateTime | undefined>(currentWeek.start);
  const [end, setEnd] = useState<DateTime | undefined>(currentWeek.end);

  const valid = member !== undefined;

  const handleSubmit = () => {
    setShow(false);
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group as={Row} controlId='shift'>
            <Form.Label column sm={3}>Shift</Form.Label>
            <Col sm={9}>
              <RadioButtonGroup<Shift>
                options={[
                  { value: Shift.DAY, label: '☀️ Day', variant: 'primary' },
                  { value: Shift.NIGHT, label: '🌃 Night', variant: 'primary' },
                ]}
                value={shift}
                onChange={setShift}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId='member'>
            <Form.Label column sm={3}>Duty officer</Form.Label>
            <Col sm={9}>
              <MemberSelector id='do-member-selector' value={member} onChange={setMember} />
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId='from'>
            <Form.Label column sm={3}>From</Form.Label>
            <Col sm={9}>
              <DatePicker
                selected={start ? start.toJSDate() : null}
                onChange={date => setStart(date ? DateTime.fromJSDate(date) : undefined)}
                showTimeSelect
                timeFormat='HH:mm'
                dateFormat='MMMM d, yyyy h:mm aa'
                className='form-control'
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId='to'>
            <Form.Label column sm={3}>To</Form.Label>
            <Col sm={9}>
              <DatePicker
                selected={end ? end.toJSDate() : null}
                onChange={date => setEnd(date ? DateTime.fromJSDate(date) : undefined)}
                showTimeSelect
                timeFormat='HH:mm'
                dateFormat='MMMM d, yyyy h:mm aa'
                className='form-control'
              />
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type='submit' variant='success' disabled={!valid}>
            Save Duty Officer
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

interface TableProps {
  interval: Interval;
  data: Array<{
    shift: Shift;
    interval: Interval;
    member: { fullName: string; };
  }>;
}

const Table: React.FC<TableProps> = ({ interval, data }) => {
  const days = getDayIntervals(interval);

  return (
    <div id='do-table'>
      <div className='gutter column'></div>
      {days.map((day, index) => {
        const overlapped = data.filter(({ interval }) => interval.overlaps(day));

        return (
          <div className='day column' key={index}>
            <div className='date'>
              {day.start.toLocaleString({ weekday: 'short', day: '2-digit' })}
            </div>
            <div className='day-container'>
              {day.divideEqually(24).map((_hour, index) => (
                <div key={index} className='hour' />
              ))}
              {overlapped.map(({ shift, interval, member }) => {
                const from = getIntervalPosition(day, interval.start);
                const to = getIntervalPosition(day, interval.end);
                const style = { top: `${from * 100}%`, bottom: `${(1 - to) * 100}%` };

                return (
                  <div className={`do-block do-${shift.toLowerCase()}`} style={style}>
                    {member.fullName}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface Params {
  week?: string;
}

const DUTY_OFFICERS_QUERY = gql`
  query ($from: DateTime!, $to: DateTime!) {
    dutyOfficers(from: $from, to: $to) {
      shift
      from
      to
      member {
        fullName
      }
    }
  }
`;

interface DutyOfficerVars {
  from: Date;
  to: Date;
}

interface DutyOfficersData {
  dutyOfficers: Array<{
    shift: Shift;
    from: string;
    to: string;
    member: { fullName: string; };
  }>;
}

const DutyOfficer: React.FC = () => {
  const history = useHistory();
  const params = useParams<Params>();

  const [editing, setEditing] = useState(false);

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  useEffect(() => {
    document.title = getDocumentTitle('Duty Officers');
  });

  const handleWeekChange = (value: Interval) => {
    history.replace(`/unit/do/${value.start.toISODate()}`);
  };

  const handleEdit = () => setEditing(true);

  return (
    <React.Fragment>
      <div className='p-3 border-bottom'>
        <Button variant='primary' className='mr-2' onClick={handleEdit}>
          <FaUser /> Set Duty Officer
        </Button>
        <WeekBrowser value={week} onChange={handleWeekChange} />
      </div>
      <Query<DutyOfficersData, DutyOfficerVars>
        query={DUTY_OFFICERS_QUERY}
        variables={{ from: week.start.toJSDate(), to: week.end.toJSDate() }}
      >
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <Alert variant='info' className='m-3'>
                <Spinner size='sm' animation='border' /> Loading duty officers&hellip;
              </Alert>
            );
          }

          if (error || !data) {
            return (
              <Alert variant='danger' className='m-3'>Error loading duty officers</Alert>
            );
          }

          const transformed = data.dutyOfficers.map(val => ({
            shift: val.shift,
            interval: Interval.fromDateTimes(DateTime.fromISO(val.from), DateTime.fromISO(val.to)),
            member: val.member,
          }));

          return <Table interval={week} data={transformed} />;
        }}
      </Query>
      <EditModal show={editing} setShow={setEditing} />
    </React.Fragment>
  );
};

export default DutyOfficer;
