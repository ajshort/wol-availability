import gql from 'graphql-tag';
import React, { useState } from 'react';
import { Mutation } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { FaArrowLeft } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';

import { SHIFTS } from '../config';
import { getMemberShiftAvailability } from '../utils';
import AvailableCell from './AvailableCell';
import QualificationBadge from './QualificationBadge';
import TeamBadge from './TeamBadge';

const SET_AVAILABILITIES_MUTATION = gql`
  mutation ($member: Int!, $availabilities: [AvailabilityInput!]!) {
    setAvailabilities(memberNumber: $member, availabilities: $availabilities)
  }
`;

const MemberAvailabilityForm = ({ member, week }) => {
  const initial = getMemberShiftAvailability(week, member.availabilities);

  // Put all our availability in a big array.
  const [availabilities, setAvailabilities] = useState(initial);
  const [saved, setSaved] = useState(false);

  const handleAvailabilityChange = (date, shift, available) => {
    const dayIndex = date.diff(week, 'days');
    const shiftIndex = SHIFTS.indexOf(shift);

    const changed = [...availabilities];
    changed[dayIndex].shifts[shiftIndex].available = available;

    setAvailabilities(changed);
  };

  const handleSubmit = (event, mutation) => {
    event.preventDefault();
    event.stopPropagation();

    setSaved(false);
    mutation();
  };

  const variables = {
    member: member.number,
    availabilities: availabilities.map(({ date, shifts }) => {
      const records = [];

      for (const { shift, enabled, available } of shifts) {
        if (enabled) {
          records.push({ date: date.format('YYYY-MM-DD'), shift, available: available === true });
        }
      }

      return records;
    }).flat(),
  };

  return (
    <Mutation
      mutation={SET_AVAILABILITIES_MUTATION}
      variables={variables}
      onCompleted={() => setSaved(true)}
    >
      {(mutation, { loading, error }) => (
        <Form className='member-availability-form' onSubmit={e => handleSubmit(e, mutation)}>
          <h3>{member.fullName} <TeamBadge team={member.team} /></h3>
          <p>
            {member.qualifications.sort().map(qual => (
              <QualificationBadge key={qual} qualification={qual} className='mr-1' />
            ))}
          </p>
          {saved && (
            <Alert variant='success'>Your availability has been saved.</Alert>
          )}
          {error && (
            <Alert variant='danger'>There was an error saving your availability.</Alert>
          )}
          <Table>
            <thead>
              <tr>
                <th scope='col'>Date</th>
                <th scope='col'>0600 - 1200</th>
                <th scope='col'>1200 - 1800</th>
                <th scope='col'>1800 - 0600</th>
              </tr>
            </thead>
            <tbody>
              {availabilities.map(({ date, shifts }) => (
                <tr key={date.unix()}>
                  <th scope='row'>{date.format('ddd D/M')}</th>
                  {shifts.map(({ shift, enabled, available }) => {
                    if (!enabled) {
                      return <td key={shift} className='table-secondary' />;
                    }

                    return (
                      <AvailableCell
                        key={shift}
                        available={available}
                        onChange={available => handleAvailabilityChange(date, shift, available)}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
          <ButtonToolbar className='justify-content-between'>
            <LinkContainer to='/member'>
              <Button variant='link'><FaArrowLeft /> Back</Button>
            </LinkContainer>
            <Button type='submit' variant='primary' disabled={loading}>
              {loading ? (
                <><Spinner animation='border' size='sm' /> Saving&hellip;</>
              ) : (
                'Save Availability'
              )}
            </Button>
          </ButtonToolbar>
        </Form>
      )}
    </Mutation>
  );
};

export default MemberAvailabilityForm;
