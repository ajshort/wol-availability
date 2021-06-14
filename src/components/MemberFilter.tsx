import { FLEXIBLE_TEAMS, SUPPORT_TEAMS } from '../model/teams';
import { QUALIFICATIONS } from '../model/qualifications';
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
  value: MemberFilter;
  onChange: (filter: MemberFilter) => void;
}

export const MemberFilterButton: React.FC<MemberFilterButtonProps> = props => {
  const { id, teams, value, onChange } = props;

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
        <Form.Group controlId='qualifications-filter'>
          <Form.Label>Qualifications</Form.Label>
          <Typeahead
            id={`${id}-typeahead`}
            multiple
            options={Object.entries(QUALIFICATIONS).map(([id, value]) => ({ id, label: value.name }))}
            selected={value.qualifications?.map(code => ({ id: code, label: QUALIFICATIONS[code].name }))}
            onChange={qualifications => onChange({
              ...value,
              qualifications: qualifications.map(({ id }) => id),
            })}
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

export function filterAcceptsMember(filter: MemberFilter, data: MemberWithAvailabilityData) {
  // if (filter.team && member.team !== filter.team) {
  //   return false;
  // }

  if (filter.qualifications && filter.qualifications.length > 0) {
    for (const qual of filter.qualifications) {
      if (!data.member.qualifications.includes(qual)) {
        return false;
      }
    }
  }

  if (filter.hideBlankAndUnavailable) {
    if (data.availabilities.length === 0) {
      return false;
    }

    if (!data.availabilities.some(({ storm, rescue }) => (storm === 'AVAILABLE' || rescue === 'IMMEDIATE' || rescue === 'SUPPORT'))) {
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
