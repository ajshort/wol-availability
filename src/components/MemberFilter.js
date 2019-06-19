import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import QualificationsDropdown from './QualificationsDropdown';

const MemberFilterOverlay = ({ teams, ...props }) => (
  <Popover id='member-filter-overlay' title='Filter Members' {...props}>
    <Form>
      <Form.Group controlId='team-filter'>
        <Form.Label>Team</Form.Label>
        <Form.Control
          as='select'
          className='custom-select'
        >
          <option value={''}>All</option>
          {teams.map(team => (
            <option key={team}>{team}</option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group controlId='qualifications-filter'>
        <Form.Label>Qualifications</Form.Label>
        <Form.Control
          as={QualificationsDropdown}
          variant='info'
        />
      </Form.Group>
    </Form>
  </Popover>
);

const MemberFilter = ({ teams }) => (
  <OverlayTrigger
    trigger='click'
    placement='bottom'
    overlay={<MemberFilterOverlay teams={teams} />}
  >
    <Button variant='link'>Filter Members</Button>
  </OverlayTrigger>
);

export default MemberFilter;
