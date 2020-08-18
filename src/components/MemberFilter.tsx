import { ALL } from '../model/qualifications';
import { FLEXIBLE_TEAMS, SUPPORT_TEAMS } from '../model/teams';
import { MemberWithAvailabilityData } from '../queries/availability';

import React from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FaChevronDown } from 'react-icons/fa';

export interface MemberFilter {
  team?: string;
  qualifications?: string[];
  hideBlankAndUnavailable?: boolean;
  hideFlexibleAndSupport?: boolean;
}

interface MemberFilterButtonProps {
  id: string;
  value: MemberFilter;
  onChange: (filter: MemberFilter) => void;
}

export const MemberFilterButton: React.FC<MemberFilterButtonProps> = props => {
  const { id, value, onChange } = props;

  const popover = (
    <Popover id={id} title='Filter Members'>
      <Form className='p-3'>
        <Form.Group controlId='team-filter'>
          <Form.Label>Team</Form.Label>
          <Form.Control
            as='select'
            className='custom-select'
            value={value.team}
            onChange={e => onChange({ ...value, team: e.target.value })}
          >
            <option value={''}>All</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId='qualifications-filter'>
          <Form.Label>Qualifications</Form.Label>
          <Typeahead
            multiple
            options={ALL}
            selected={value.qualifications}
            onChange={qualifications => onChange({ ...value, qualifications })}
          />
        </Form.Group>
        <Form.Group controlId='hide-blank-filter'>
          <Form.Check
            type='checkbox'
            label='Hide blank and unavailable?'
            checked={value.hideBlankAndUnavailable}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(
              { ...value, hideBlankAndUnavailable: e.target.checked}
            )}
          />
        </Form.Group>
        <Form.Group controlId='hide-flexible-support-filter'>
          <Form.Check
            type='checkbox'
            label='Hide blank flexible and support?'
            checked={value.hideFlexibleAndSupport}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(
              { ...value, hideFlexibleAndSupport: e.target.checked}
            )}
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

export function filterAcceptsMember(filter: MemberFilter, member: MemberWithAvailabilityData) {
  if (filter.qualifications && filter.qualifications.length > 0) {
    for (const qual of filter.qualifications) {
      if (!member.qualifications.includes(qual)) {
        return false;
      }
    }
  }

  if (filter.hideFlexibleAndSupport) {
    const flexible = FLEXIBLE_TEAMS.includes(member.team) || SUPPORT_TEAMS.includes(member.team);
    const filteredTo = filter.team === member.team;

    if (flexible && !filteredTo) {
      return false;
    }
  }

  return true;
}
