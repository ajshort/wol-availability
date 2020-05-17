import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FaChevronDown } from 'react-icons/fa';

import { Typeahead } from 'react-bootstrap-typeahead';

const MemberFilter = (props) => {
  const popover = (
    <Popover title='Filter Members'>
      <Form className='p-2'>
        <Form.Group controlId='team-filter'>
          <Form.Label>Team</Form.Label>
          <Form.Control
            as='select'
            className='custom-select'
            value={props.team}
            onChange={e => props.onTeamChanged(e.target.value)}
          >
            <option value={''}>All</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId='qualifications-filter'>
          <Form.Label>Qualifications</Form.Label>
          <Typeahead
            options={[]}
            onChange={() => {}}
          />
        </Form.Group>
        <Form.Group controlId='hide-blank-filter'>
          <Form.Check
            type='checkbox'
            label='Hide blank and unavailable?'
            checked={props.hideBlankAndUnavailable}
            onChange={e => props.onHideBlankAndUnavailableChanged(e.target.checked)}
          />
        </Form.Group>
        <Form.Group controlId='hide-flexible-support-filter'>
          <Form.Check
            type='checkbox'
            label='Hide blank flexible and support?'
            checked={props.hideFlexibleAndSupport}
            onChange={e => props.onHideFlexibleAndSupportChanged(e.target.checked)}
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
