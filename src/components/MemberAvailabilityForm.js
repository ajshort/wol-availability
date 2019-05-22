import React from 'react';
import Form from 'react-bootstrap/Form';

import QualificationBadge from '../components/QualificationBadge';
import TeamBadge from '../components/TeamBadge';

const MemberAvailabilityForm = ({ member }) => (
  <Form>
    <h3>{member.fullName} <TeamBadge team={member.team} /></h3>
    <p>
      {member.qualifications.sort().map(qual => (
        <QualificationBadge key={qual} qualification={qual} className='mr-1' />
      ))}
    </p>
  </Form>
);

export default MemberAvailabilityForm;
