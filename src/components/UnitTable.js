import React from 'react';
import Table from 'react-bootstrap/Table';

import { SHIFTS } from '../config';
import QualificationBadge from './QualificationBadge';
import TeamBadge from './TeamBadge';

const MemberRow = ({ member }) => (
  <tr>
    <td className='member' title={member.number}>{member.fullName}</td>
    <td className='team'><TeamBadge team={member.team} /></td>
    <td className='quals'>
      {member.qualifications.sort().map(qual => (
        <QualificationBadge key={qual} qualification={qual} className='mr-1' />
      ))}
    </td>
    {member.shifts.map(({ date, shifts }) => (
      <React.Fragment key={date.unix()}>
        {shifts.map(({ shift, enabled, available }) => {
          if (!enabled) {
            return <td key={shift} className='table-secondary' />;
          }

          let cls;

          if (available === true) {
            cls = 'table-success';
          } else if (available === false) {
            cls = 'table-danger';
          }

          return <td key={shift} className={cls}></td>;
        })}
      </React.Fragment>
    ))}
  </tr>
);

const UnitTable = ({ members, from, to }) => {
  const days = [];

  for (const day = from.clone(); day <= to; day.add(1, 'days')) {
    days.push(day.clone());
  }

  // TODO
  // Summarise how many members we have available.
  const sum = members.reduce((total, member) => {
    let i = 0;

    for (const { shifts } of member.shifts) {
      for (const { enabled, available } of shifts) {
        if (!enabled) {
          continue;
        }

        if (available) {
          ++total[i];
        }

        ++i;
      }
    }

    return total;
  }, new Array(7 * SHIFTS.length).fill(0));

  return (
    <Table size='sm' responsive className='UnitTable'>
      <thead>
        <tr>
          <th scope='col' className='member' rowSpan={2}>Member</th>
          <th scope='col' className='team' rowSpan={2}>Team</th>
          <th scope='col' className='quals' rowSpan={2}>Qualifications</th>
          {days.map(date => (
            <th key={date.unix()} scope='col' colSpan={3} className='day'>
              {date.format('ddd D/M')}
            </th>
          ))}
        </tr>
        <tr>
          {days.map(date => (
            <React.Fragment key={date.unix()}>
              <th scope='col' className='shift shift-morning' title='0600 - 1200'>
                <span role='img' aria-label='0600 - 1200'>🌅</span>
              </th>
              <th scope='col' className='shift shift-afternoon' title='1200 - 1800'>
                <span role='img' aria-label='1200 - 1800'>🌞</span>
              </th>
              <th scope='col' className='shift shift-night' title='1800 - 0600'>
                <span role='img' aria-label='1800 - 0600'>🌃</span>
              </th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {members.map(member => <MemberRow key={member.number} member={member} />)}
      </tbody>
      <tfoot>
        <tr>
          <th scope='col' colSpan={3}>{members.length}</th>
        </tr>
      </tfoot>
    </Table>
  );
};

export default UnitTable;
