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
  teams?: string[];
  qualifications?: string[];
  value: MemberFilter;
  onChange: (filter: MemberFilter) => void;
}

export const MemberFilterButton: React.FC<MemberFilterButtonProps> = props => {
  const { id, teams, qualifications, value, onChange } = props;

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
            {teams && teams.map(team => <option key={team}>{team}</option>)}
          </Form.Control>
        </Form.Group>
        {qualifications && (
          <Form.Group controlId='qualifications-filter'>
            <Form.Label>Qualifications</Form.Label>
            <Typeahead
              id={`${id}-typeahead`}
              multiple
              options={qualifications}
              selected={value.qualifications}
              onChange={qualifications => onChange({ ...value, qualifications })}
            />
          </Form.Group>
        )}
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
  // if (filter.team && member.team !== filter.team) {
  //   return false;
  // }

  if (filter.qualifications && filter.qualifications.length > 0) {
    for (const qual of filter.qualifications) {
      if (!member.qualifications.includes(qual)) {
        return false;
      }
    }
  }

  if (filter.hideBlankAndUnavailable) {
    if (member.availabilities.length === 0) {
      return false;
    }

    if (!member.availabilities.some(({ storm, rescue }) => (storm === 'AVAILABLE' || rescue === 'IMMEDIATE' || rescue === 'SUPPORT'))) {
      return false;
    }
  }

  // if (filter.hideFlexibleAndSupport) {
  //   const flexible = FLEXIBLE_TEAMS.includes(member.team) || SUPPORT_TEAMS.includes(member.team);
  //   const filteredTo = filter.team === member.team;

  //   if (flexible && !filteredTo) {
  //     return false;
  //   }
  // }

  return true;
}
