import MemberSelector from '../components/MemberSelector';
import WeekBrowser from '../components/WeekBrowser';
import { Shift } from '../model/availability';
import { getDayIntervals, getNow, getWeekInterval, TIME_ZONE } from '../model/dates';
import { getDocumentTitle } from '../utils';

import { DateTime, Interval } from 'luxon';
import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FaUser } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';

interface EditModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

const EditModal: React.FC<EditModalProps> = ({ show, setShow }) => {
  const onHide = () => setShow(false);

  const [shift, setShift] = useState<Shift>(Shift.DAY);
  const [member, setMember] = useState<number | undefined>(undefined);
  const [interval, setInterval] = useState<Interval>(
    Interval.fromDateTimes(getNow(), getWeekInterval().end)
  );

  const valid = member !== undefined && interval.isValid;

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Form>
        <Modal.Body>
          <Form.Group controlId='shift'>
            <Form.Label>Shift</Form.Label>
            <Form.Control as='select' className='custom-select' value={shift}>
              <option value={Shift.DAY}>Day shift</option>
              <option value={Shift.NIGHT}>Night shift</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId='member'>
            <Form.Label>Duty officer</Form.Label>
            <MemberSelector id='do-member-selector' value={member} onChange={setMember} />
          </Form.Group>
          <Form.Group controlId='from'>
            <Form.Label>From</Form.Label>
          </Form.Group>
          <Form.Group controlId='to'>
            <Form.Label>To</Form.Label>
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
}

const Table: React.FC<TableProps> = ({ interval }) => {
  const days = getDayIntervals(interval);

  return (
    <div id='do-table'>
      <div className='gutter column'></div>
      {days.map((day, index) => (
        <div className='day column' key={index}>
          <div className='date'>
            {day.start.toLocaleString({ weekday: 'short', day: '2-digit' })}
          </div>
          <div className='day-container'>
            {day.divideEqually(24).map((_hour, index) => (
              <div key={index} className='hour' />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface Params {
  week?: string;
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
      <Table interval={week} />
      <EditModal show={editing} setShow={setEditing} />
    </React.Fragment>
  )
};

export default DutyOfficer;
