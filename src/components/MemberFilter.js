import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FaChevronDown } from 'react-icons/fa';

import QualificationsDropdown from './QualificationsDropdown';

const MemberFilter = (props) => {
  const popover = (
    <Popover title='Filter Members'>
      <Form>
        <Form.Group controlId='team-filter'>
          <Form.Label>Team</Form.Label>
          <Form.Control
            as='select'
            className='custom-select'
            value={props.team}
            onChange={e => props.onTeamChanged(e.target.value)}
          >
            <option value={''}>All</option>
            {props.teams.map(team => (
              <option key={team}>{team}</option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId='qualifications-filter'>
          <Form.Label>Qualifications</Form.Label>
          <Form.Control
            as={QualificationsDropdown}
            variant='info'
            selected={props.qualifications}
            onChange={props.onQualificationsChanged}
          />
        </Form.Group>
        <Form.Group controlId='hide-blank-filter'>
          <Form.Check
            type='checkbox'
            label='Hide blank?'
            checked={props.hideBlank}
            onChange={e => props.onHideBlankChanged(e.target.checked)}
          />
        </Form.Group>
      </Form>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger='click'
      placement='bottom'
      overlay={popover}
    >
      <Button variant='secondary'>Filter <FaChevronDown /></Button>
    </OverlayTrigger>
  );
};

export default MemberFilter;
