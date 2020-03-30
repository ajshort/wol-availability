import { getNow, getWeekInterval } from '../model/dates';

import { DateTime, Interval } from 'luxon';
import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FaArrowLeft, FaArrowRight, FaCalendar } from 'react-icons/fa';

export interface WeekBrowserProps {
  value: Interval;
  onChange: (value: Interval) => void;
}

const WeekBrowser: React.FC<WeekBrowserProps> = ({ value, onChange }) => {
  const { start } = value;

  const nowWeek = getWeekInterval();

  const handleToday = () => onChange(nowWeek);
  const handlePrevious = () => onChange(getWeekInterval(start.minus({ week: 1 })));
  const handleNext = () => onChange(getWeekInterval(start.plus({ week: 1 })));

  return (
    <React.Fragment>
      <Button
        variant='secondary'
        onClick={handleToday}
        disabled={nowWeek.equals(value)}
        className='mr-2'
      >
        <span className='d-none d-md-inline'>Today</span>
        <span className='d-md-none'><FaCalendar /></span>
      </Button>
      <ButtonGroup className='mr-2'>
        <Button variant='outline-secondary' onClick={handlePrevious}><FaArrowLeft /></Button>
        <Button variant='outline-secondary' onClick={handleNext}><FaArrowRight /></Button>
      </ButtonGroup>
      <span className='d-none d-sm-inline'>{value.start.toLocaleString(DateTime.DATE_MED)}</span>
    </React.Fragment>
  );
};

export default WeekBrowser;
