import MemberSelector from '../components/MemberSelector';
import RadioButtonGroup from '../components/RadioButtonGroup';
import WeekBrowser from '../components/WeekBrowser';
import { Shift } from '../model/availability';
import { getDayIntervals, getIntervalPosition, getWeekInterval, TIME_ZONE } from '../model/dates';
import { getDocumentTitle } from '../utils';

import clsx from 'clsx';
import gql from 'graphql-tag';
import _ from 'lodash';
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
import { Mutation, Query } from 'react-apollo';

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

const SET_AVAILABILITY_MUTATION = gql`
  mutation ($shift: TeamShift!, $member: Int!, $from: DateTime!, $to: DateTime!) {
    setDutyOfficer(shift: $shift, member: $member, from: $from, to: $to)
  }
`;

interface SetAvailabilityData {
  shift: Shift;
  member: number;
  from: Date;
  to: Date;
}

interface EditModalProps {
  week: Interval;
  show: boolean;
  setShow: (show: boolean) => void;
}

const EditModal: React.FC<EditModalProps> = ({ week, show, setShow }) => {
  const [shift, setShift] = useState<Shift>(Shift.DAY);
  const [member, setMember] = useState<number | undefined>(undefined);
  const [interval, setInterval] = useState(week);
  const [custom, setCustom] = useState(false);

  const valid = member !== undefined && interval.isValid;

  // If we're not display a custom time, we truncate the from and to to be at the start/end of
  // the shift on the selected day.
  let { start, end } = interval;

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

  const setFrom = (value?: DateTime) => {
    if (!value) {
      return;
    }

    if (custom) {
      setInterval(interval.set({ start: value }));
    } else {
      setInterval(interval.set({ start: getShiftStart(value) }));
    }
  };

  const getShiftEnd = (value: DateTime) => {
    if (shift === Shift.DAY) {
      return value.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
    } else {
      return value.plus({ days: 1 }).set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
  };

  const setTo = (value?: DateTime) => {
    if (!value) {
      return;
    }

    if (custom) {
      setInterval(interval.set({ end: value }));
    } else {
      setInterval(interval.set({ end: getShiftEnd(value) }));
    }
  };

  const handleSetCustom = (set: boolean) => {
    if (set === custom) {
      return;
    }

    setCustom(set);

    // If `custom` has been disabled, we need to call the from and to setters to change the times.
    if (!set) {
      setFrom(getShiftStart(interval.start));
      setTo(getShiftEnd(interval.end));
    }
  };

  const onHide = () => {
    setShow(false);
  };

  return (
    <Mutation<Boolean, SetAvailabilityData>
      mutation={SET_AVAILABILITY_MUTATION}
      variables={{
        shift,
        member: member!,
        from: interval.start.toJSDate(),
        to: interval.end.toJSDate(),
      }}
      onCompleted={onHide}
      refetchQueries={() => [{
        query: DUTY_OFFICERS_QUERY,
        variables: { from: week.start.toJSDate(), to: week.end.toJSDate() },
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
                  <MemberSelector id='do-member-selector' value={member} onChange={setMember} />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId='from'>
                <Form.Label column sm={3}>From</Form.Label>
                <Col sm={9}>
                  <DatePicker
                    selected={start.toJSDate()}
                    onChange={date => setFrom(date ? DateTime.fromJSDate(date) : undefined)}
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
                    onChange={date => setTo(date ? DateTime.fromJSDate(date) : undefined)}
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
    member: { fullName: string; };
  }>;
}

const Table: React.FC<TableProps> = ({ interval, data }) => {
  const days = getDayIntervals(interval);

  return (
    <div id='do-table'>
      <div id='do-table-header'>
        {_.range(0, 24).map(hour => (
          <div className='do-table-header-hour'>
            {hour > 0 && (<small>{_.padStart(hour.toString(), 2, '0') + ':00'}</small>)}
          </div>
        ))}
      </div>
      {days.map((day, index) => {
        // We break availability into three chunks - night shift up to 06:00, then day shift
        // until 18:00, then night shift again.
        //
        // TODO ideally this wouldn't be hardcoded here.
        const morning = day.start.set({ hour: 6 });
        const evening = day.start.set({ hour: 18 });

        const blocks = [
          { shift: Shift.NIGHT, block: Interval.fromDateTimes(day.start, morning) },
          { shift: Shift.DAY, block: Interval.fromDateTimes(morning, evening) },
          { shift: Shift.NIGHT, block: Interval.fromDateTimes(evening, day.end) },
        ];

        // Check if this day is partially outside the week interval - of so, then draw a gray box to
        // mark it so.
        const weekStartInDay = 100 * (1 - getIntervalPosition(day, interval.start));
        const weekEndInDay = 100 * getIntervalPosition(day, interval.end);

        return (
          <div className='day' key={index}>
            <div className='date'>
              <span className='text-muted'>{day.start.toFormat('ccc')}</span>
              <span className='h5 mb-0'>{day.start.toFormat('d')}</span>
            </div>
            <div className='day-container'>
              {day.divideEqually(24).map((_hour, index) => (
                <div key={index} className='hour' />
              ))}
              {blocks.map(({ shift, block }) => (
                data
                  .filter(val => val.shift === shift)
                  .filter(val => val.interval.overlaps(block))
                  .map(({ shift, interval, member }) => {
                    const intersection = block.intersection(interval);

                    if (!intersection) {
                      return null;
                    }

                    const calculatePosition = (dt: DateTime) => (
                      dt.hour / 24 +
                      dt.minute / (24 * 60) +
                      dt.second / (24 * 60 * 60) +
                      dt.millisecond / (24 * 60 * 60 * 1000)
                    );

                    const from = calculatePosition(intersection.start);
                    const to = calculatePosition(intersection.end);
                    const className = clsx('do-block', `do-${shift.toLowerCase()}`);
                    const style = { left: `${from * 100}%`, right: `${(1 - to) * 100}%` };

                    return (
                      <div className={className} style={style}>
                        {member.fullName}
                      </div>
                    );
                 })
              ))}
              {(weekStartInDay > 0) && (
                <div
                  className='week-bound'
                  style={{ left: 0, right: `${weekStartInDay}%` }}
                />
              )}
              {(weekEndInDay < 100) && (
                <div
                  className='week-bound'
                  style={{ left: `${weekEndInDay}%`, right: 0 }}
                />
              )}
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
    history.push(`/unit/do/${value.start.toISODate()}`);
  };

  const handleEdit = () => setEditing(true);

  return (
    <React.Fragment>
      <div className='p-3 border-bottom'>
        <Button variant='primary' className='mr-2' onClick={handleEdit}>
          <FaUser />
          {' '}
          <span className='d-sm-none'>Set DO</span>
          <span className='d-none d-sm-inline'>Set Duty Officer</span>
        </Button>
        <WeekBrowser value={week} onChange={handleWeekChange} />
      </div>
      <Query<DutyOfficersData, DutyOfficerVars>
        query={DUTY_OFFICERS_QUERY}
        variables={{ from: week.start.toJSDate(), to: week.end.toJSDate() }}
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
      {editing && <EditModal week={week} show={editing} setShow={setEditing} />}
    </React.Fragment>
  );
};

export default DutyOfficer;
