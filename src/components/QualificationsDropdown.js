import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import FormCheck from 'react-bootstrap/FormCheck';

import QualificationBadge from './QualificationBadge';
import { getQualificationName } from '../utils';

const QUALIFICATIONS = [
  'CHAINSAW_CROSSCUT',
  'FLOOD_RESCUE_1',
  'FLOOD_RESCUE_2',
  'FLOOD_RESCUE_3',
  'STORM_WATER_DAMAGE',
  'VERTICAL_RESCUE',
];

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

    console.log(updated);

    onChange(updated);
  };

  return (
    <Dropdown show={show} onToggle={handleToggle}>
      <Dropdown.Toggle id={id} {...props}>
        Qualifications {selected.length > 0 && `(${selected.length})`}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {QUALIFICATIONS.map((qual) => (
          <Dropdown.Item key={qual} as='div'>
            <FormCheck
              id={`${id}-${qual}`}
              type='checkbox'
              checked={selected.includes(qual)}
              onChange={e => handleChecked(qual, e.target.checked)}
              label={
                <><QualificationBadge qualification={qual} /> {getQualificationName(qual)}</>
              }
            />
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default QualificationsDropdown;
