import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import FormCheck from 'react-bootstrap/FormCheck';

import { ABBREVIATIONS, FEATURED } from '../qualifications';
import QualificationBadge from './QualificationBadge';

const QualificationsDropdown = ({ id, selected = [], onChange = () => {}, ...props }) => {
  const [show, setShow] = useState(false);

  const handleToggle = (open, _event, { source }) => {
    setShow(source === 'select' || open);
  };

  const handleChecked = (qual, checked) => {
    const updated = [...selected];

    if (checked && !updated.includes(qual)) {
      updated.push(qual);
    } else if (!checked && updated.includes(qual)) {
      updated.splice(updated.indexOf(qual), 1);
    }

    onChange(updated);
  };

  return (
    <Dropdown show={show} onToggle={handleToggle}>
      <Dropdown.Toggle id={id} {...props}>
        {selected && selected.length > 0 ? (
          selected.map(qual => ABBREVIATIONS[qual]).join(', ')
        ) : (
          'none'
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className='QualificationsDropdownMenu'>
        {FEATURED.map((qual) => (
          <Dropdown.Item key={qual} as='div'>
            <FormCheck
              id={`${id}-${qual}`}
              type='checkbox'
              checked={selected.includes(qual)}
              onChange={e => handleChecked(qual, e.target.checked)}
              label={
                <>
                  <QualificationBadge qualification={qual} className='mr-1' /> {qual}
                </>
              }
            />
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default QualificationsDropdown;
