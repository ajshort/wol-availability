import { UNIT_CONFIGS } from '../config/units';
import { MemberWithAvailabilityData } from '../queries/availability';

import React from 'react';
import { Typeahead } from 'react-bootstrap-typeahead';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FaChevronDown } from 'react-icons/fa';

export interface MemberFilter {
  unit?: string;
  team?: string;
  qualifications?: string[];
  hideBlankAndUnavailable?: boolean;
  hideFlexibleAndSupport?: boolean;
}

interface MemberFilterButtonProps {
  id: string;
  units?: string[];
  teams?: string[];
  qualifications?: { [code: string]: string };
  value: MemberFilter;
  onChange: (filter: MemberFilter) => void;
}

export const MemberFilterButton: React.FC<MemberFilterButtonProps> = props => {
  const { id, teams, units, value, onChange } = props;
  const qualifications = props.qualifications || {};

  const popover = (
    <Popover id={id} title='Filter Members'>
      <Form className='p-3'>
        {units && units.length > 1 && (
          <Form.Group controlId='unit-filter'>
            <Form.Label>Unit</Form.Label>
            <Form.Control
              as='select'
              className='custom-select'
              value={value.unit}
              onChange={e => onChange({ ...value, unit: e.target.value })}
            >
              <option value={''}>All</option>
              {units.map(unit => <option key={unit}>{unit}</option>)}
            </Form.Control>
          </Form.Group>
        )}
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
            options={Object.entries(qualifications).map(([id, value]) => ({ id, label: value }))}
            selected={value.qualifications?.map(code => ({ id: code, label: qualifications[code] }))}
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
  if (filter.unit && data.membership.code !== filter.unit) {
    return false;
  }

  if (filter.team && data.membership.team !== filter.team) {
    return false;
  }

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

  if (filter.hideFlexibleAndSupport) {
    const { code, team } = data.membership;
    const config = UNIT_CONFIGS[code];

    if (team && filter.team !== team && config.flexibleAndSupportTeams && config.flexibleAndSupportTeams.includes(team)) {
      return false;
    }
  }

  return true;
}
