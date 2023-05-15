import { useAuth } from '../components/AuthContext';
import MemberSelector from '../components/MemberSelector';
import Page from '../components/Page';
import RadioButtonGroup from '../components/RadioButtonGroup';
import WeekBrowser from '../components/WeekBrowser';
import WeekTable from '../components/WeekTable';
import { Shift } from '../model/availability';
import { getWeekInterval, TIME_ZONE } from '../model/dates';
import {
  GET_DUTY_OFFICERS_QUERY,
  GetDutyOfficersData,
  GetDutyOfficersVars,
  SET_DUTY_OFFICER_MUTATION,
  SetDutyOfficerVars
} from '../queries/do';

import { Mutation, Query } from '@apollo/client/react/components';
import clsx from 'clsx';
import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import { FaLock, FaUser } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';

interface EditModalProps {
  unit: string;
  week: Interval;
  show: boolean;
  setShow: (show: boolean) => void;
}

const EditModal: React.FC<EditModalProps> = ({ unit, week, show, setShow }) => {
  const [shift, setShift] = useState<Shift>(Shift.DAY);
  const [member, setMember] = useState<number | undefined>(undefined);
  const [from, setFrom] = useState<DateTime>(week.start);
  const [to, setTo] = useState<DateTime>(week.end);
  const [custom, setCustom] = useState(false);

  const interval = Interval.fromDateTimes(from, to);
  const valid = member !== undefined && interval.isValid;

  // If we're not display a custom time, we truncate the from and to to be at the start/end of
  // the shift on the selected day.
  let start = from;
  let end = to;

  if (!custom) {
    if (shift === Shift.DAY) {
      start = start.plus({ days: start.hour >= 18 ? 1 : 0 });
      end = end.minus({ days: end.minus({ milliseconds: 1 }).hour < 6 ? 1 : 0 });
    } else {
      start = start.minus({ days: start.hour < 6 ? 1 : 0 });
      end = end.minus({ days: end.minus({ milliseconds: 1 }).hour < 18 ? 1 : 0 });
    }
  }

  const getShiftStart = (value: DateTime) => {
    if (shift === Shift.DAY) {
      return value.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    } else {
      return value.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    }
  };

  const handleSetFrom = (value?: DateTime) => {
    if (!value) {
      return;
    }

    if (custom) {
      setFrom(value);
    } else {
      setFrom(getShiftStart(value));
    }
  };

  const getShiftEnd = (value: DateTime) => {
    if (shift === Shift.DAY) {
      return value.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    } else {
      return value.plus({ days: 1 }).set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
  };

  const handleSetTo = (value?: DateTime) => {
    if (!value) {
      return;
    }

    if (custom) {
      setTo(value);
    } else {
      setTo(getShiftEnd(value));
    }
  };

  const handleSetCustom = (set: boolean) => {
    if (set === custom) {
      return;
    }

    setCustom(set);

    // If `custom` has been disabled, we need to call the from and to setters to change the times.
    if (!set) {
      setFrom(getShiftStart(from));
      setTo(getShiftEnd(to));
    }
  };

  const onHide = () => {
    setShow(false);
  };

  return (
    <Mutation<boolean, SetDutyOfficerVars>
      mutation={SET_DUTY_OFFICER_MUTATION}
      variables={{
        unit,
        shift,
        member: member !== undefined && member !== 0 ? member : null,
        from: from.toJSDate(),
        to: to.toJSDate(),
      }}
      onCompleted={onHide}
      refetchQueries={() => [{
        query: GET_DUTY_OFFICERS_QUERY,
        variables: { unit, from: week.start.toJSDate(), to: week.end.toJSDate() },
      }]}
    >
      {(mutate, { loading, error }) => (
        <Modal show={show} onHide={onHide}>
          <Form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              event.stopPropagation();
              mutate();
            }}
          >
            <Modal.Body>
              {error && (
                <Alert variant='danger'>Error saving duty officer</Alert>
              )}
              <Form.Group as={Row} controlId='shift'>
                <Form.Label column sm={3}>Shift</Form.Label>
                <Col sm={9}>
                  <RadioButtonGroup<Shift>
                    options={[
                      { value: Shift.DAY, label: '☀️ Day', variant: 'primary' },
                      { value: Shift.NIGHT, label: '🌃 Night', variant: 'primary' },
                    ]}
                    value={shift}
                    onChange={shift => (shift !== undefined && setShift(shift))}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId='member'>
                <Form.Label column sm={3}>Duty officer</Form.Label>
                <Col sm={9}>
                  <MemberSelector id='do-member-selector' unit={unit} onChange={setMember} allowNone />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId='from'>
                <Form.Label column sm={3}>From</Form.Label>
                <Col sm={9}>
                  <DatePicker
                    selected={start.toJSDate()}
                    onChange={date => handleSetFrom(date ? DateTime.fromJSDate(date) : undefined)}
                    showTimeSelect={custom}
                    dateFormat={custom ? 'cccc do MMM yyyy HH:mm' : 'cccc do MMM yyyy'}
                    className='form-control'
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId='to'>
                <Form.Label column sm={3}>To</Form.Label>
                <Col sm={9}>
                  <DatePicker
                    selected={end.toJSDate()}
                    onChange={date => handleSetTo(date ? DateTime.fromJSDate(date) : undefined)}
                    showTimeSelect={custom}
                    dateFormat={custom ? 'cccc do MMM yyyy HH:mm' : 'cccc do MMM yyyy'}
                    className='form-control'
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId='custom-times'>
                <Col sm={{ span: 9, offset: 3 }}>
                  <Form.Check
                    custom
                    label='Enter custom start and end times?'
                    checked={custom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSetCustom(e.target.checked)}
                  />
                </Col>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant='secondary' disabled={loading} onClick={onHide}>
                Close
              </Button>
              <Button type='submit' variant='success' disabled={!valid || loading}>
                {loading ? (
                  <><Spinner size='sm' animation='border' /> Saving Duty Officer &hellip;</>
                ) : (
                  <>Save Duty Officer</>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Mutation>
  );
};

interface TableProps {
  interval: Interval;
  data: Array<{
    shift: Shift;
    interval: Interval;
    member?: { fullName: string; };
  }>;
}

const Table: React.FC<TableProps> = ({ interval, data }) => (
  <WeekTable interval={interval}>
    {row => {
      // We split the row into two blocks at 1800.
      const split = row.start.set({ hour: 18 });

      const blocks = [
        { shift: Shift.DAY, block: Interval.fromDateTimes(row.start, split) },
        { shift: Shift.NIGHT, block: Interval.fromDateTimes(split, row.end) },
      ];

      return blocks.map(({ shift, block }) => (
        data
          .filter(val => val.shift === shift)
          .filter(val => val.interval.overlaps(block))
          .map(({ shift, interval, member }) => {
            const intersection = block.intersection(interval);

            if (!intersection) {
              return null;
            }

            const calculatePosition = (dt: DateTime, closed: boolean) => {
              let hour: number;

              if (closed) {
                hour = (dt.hour < 6) ? dt.hour + 18 : dt.hour - 6;
              } else {
                hour = (dt.hour <= 6) ? dt.hour + 18 : dt.hour - 6;
              }

              return (
                hour / 24 +
                dt.minute / (24 * 60) +
                dt.second / (24 * 60 * 60) +
                dt.millisecond / (24 * 60 * 60 * 1000)
              );
            };

            const from = calculatePosition(intersection.start, true);
            const to = calculatePosition(intersection.end, false);
            const className = clsx('do-block', `do-${shift.toLowerCase()}`);
            const style = { left: `${from * 100}%`, right: `${(1 - to) * 100}%` };

            return (
              <div className={className} style={style}>
                {member?.fullName || '(unknown)'}
              </div>
            );
         })
      ))
    }}
  </WeekTable>
);

interface Params {
  week?: string;
}

const DutyOfficer: React.FC = () => {
  const auth = useAuth();
  const history = useHistory();
  const params = useParams<Params>();

  const [editing, setEditing] = useState(false);

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const visible = Interval.fromDateTimes(week.start.startOf('day'), week.end.endOf('day'));

  const handleWeekChange = (value: Interval) => {
    history.push(`/unit/do/${value.start.toISODate()}`);
  };

  const { code: unit, permission } = auth.unit!;
  const authed: any = auth.member;
  const canEdit = true; // permission === 'EDIT_TEAM' || permission === 'EDIT_UNIT';

  const handleEdit = () => setEditing(true);

  return (
    <Page title='Duty Officers'>
      <div className='p-3 border-bottom display-flex align-items-center'>
        <Button variant='primary' className='mr-2' disabled={!canEdit} onClick={handleEdit}>
          {canEdit ? <FaUser /> : <FaLock />}
          {' '}
          <span className='d-sm-none'>Set DO</span>
          <span className='d-none d-sm-inline'>Set Duty Officer</span>
        </Button>
        <WeekBrowser value={week} onChange={handleWeekChange} />
      </div>
      <Query<GetDutyOfficersData, GetDutyOfficersVars>
        query={GET_DUTY_OFFICERS_QUERY}
        variables={{ unit, from: visible.start.toJSDate(), to: visible.end.toJSDate() }}
        fetchPolicy='network-only'
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
      {editing && <EditModal unit={unit} week={week} show={editing} setShow={setEditing} />}
    </Page>
  );
};

export default DutyOfficer;
