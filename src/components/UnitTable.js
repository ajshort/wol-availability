import classnames from 'classnames';
import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';

import AuthCheck from './AuthCheck';
import QualificationBadge from './QualificationBadge';
import TeamBadge from './TeamBadge';

const EditableShiftCell = ({ defaultAvailable, shift }) => {
  const [available, setAvailable] = useState(defaultAvailable);

  const classes = ['shift', `shift-${shift.toLowerCase()}`];

  if (available === true) {
    classes.push('table-success');
  } else if (available === false) {
    classes.push('table-danger');
  }

  return (
    <td className={classnames(classes)}>
      <label>
        <input type='checkbox' checked={available === true} />
      </label>
    </td>
  );
}

const MemberRow = ({ member }) => (
  <tr>
    <td className='member' title={member.number}>{member.fullName}</td>
    <td className='team'><TeamBadge team={member.team} /></td>
    <td className='quals'>
      {member.qualifications.sort().map(qual => (
        <QualificationBadge key={qual} qualification={qual} className='mr-1' />
      ))}
    </td>
    <AuthCheck target={member}>
      {editable => member.shifts.map(({ date, shifts }) => (
        <React.Fragment key={date.unix()}>
          {shifts.map(({ shift, enabled, available }) => {
            if (!enabled) {
              return <td key={shift} className='table-secondary' />;
            }

            if (!editable) {
              let className = `shift-${shift.toLowerCase()}`;

              if (available === true) {
                className = 'table-success';
              } else if (available === false) {
                className = 'table-danger';
              }

              return (
                <td key={shift} className={className}></td>
              );
            }

            return (
              <EditableShiftCell
                key={shift}
                shift={shift}
                defaultAvailable={available}
              />
            );
          })}
        </React.Fragment>
      ))}
    </AuthCheck>
  </tr>
);

const UnitTable = ({ members, from, to }) => {
  const days = [];

  for (const day = from.clone(); day <= to; day.add(1, 'days')) {
    days.push(day.clone());
  }

  // TODO Summarise how many members we have available.
  // const sum = members.reduce((total, member) => {
  //   let i = 0;

  //   for (const { shifts } of member.shifts) {
  //     for (const { enabled, available } of shifts) {
  //       if (!enabled) {
  //         continue;
  //       }

  //       if (available) {
  //         ++total[i];
  //       }

  //       ++i;
  //     }
  //   }

  //   return total;
  // }, new Array(7 * SHIFTS.length).fill(0));

  return (
    <Table size='sm' responsive className='unit-table'>
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
