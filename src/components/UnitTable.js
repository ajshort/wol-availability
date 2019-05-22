import React from 'react';
import Table from 'react-bootstrap/Table';

import QualificationBadge from './QualificationBadge';
import TeamBadge from './TeamBadge';

const MemberRow = ({ member }) => (
  <tr>
    <td>{member.fullName}</td>
    <td><TeamBadge team={member.team} /></td>
    <td>
      {member.qualifications.map(qual => (
        <QualificationBadge key={qual} qualification={qual} />
      ))}
    </td>
  </tr>
)

const UnitTable = ({ members }) => (
  <Table size='sm'>
    <thead>
      <tr>
        <th scope='col'>Member</th>
        <th scope='col'>Team</th>
        <th scope='col'>Qualifications</th>
      </tr>
    </thead>
    <tbody>
      {members.map(member => <MemberRow key={member.number} member={member} />)}
    </tbody>
    <tfoot>
      <tr>
        <th scope='col'>{members.length}</th>
        <th></th>
        <th></th>
      </tr>
    </tfoot>
  </Table>
);

export default UnitTable;
