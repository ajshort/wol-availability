import React from 'react';
import Table from 'react-bootstrap/Table';

import QualificationBadge from './QualificationBadge';
import TeamBadge from './TeamBadge';

const MemberRow = ({ member }) => (
  <tr>
    <td className='member'>{member.fullName}</td>
    <td className='team'><TeamBadge team={member.team} /></td>
    <td className='quals'>
      {member.qualifications.map(qual => (
        <QualificationBadge key={qual} qualification={qual} />
      ))}
    </td>
  </tr>
)

const UnitTable = ({ members, days }) => (
  <Table size='sm' responsive className='UnitTable'>
    <thead>
      <tr>
        <th scope='col' className='member' rowSpan={2}>Member</th>
        <th scope='col' className='team' rowSpan={2}>Team</th>
        <th scope='col' className='quals' rowSpan={2}>Qualifications</th>
        {days.map(({ date }) => (
          <th key={date.unix()} scope='col' colSpan={3} className='day'>
            {date.format('ddd D/M')}
          </th>
        ))}
      </tr>
      <tr>
        {days.map(({ date }) => (
          <React.Fragment key={date.unix()}>
            <th scope='col' className='shift shift-morning'>🌅</th>
            <th scope='col' className='shift shift-afternoon'>🌞</th>
            <th scope='col' className='shift shift-evening'>🌃</th>
          </React.Fragment>
        ))}
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
