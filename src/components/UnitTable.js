import classnames from 'classnames';
import gql from 'graphql-tag';
import React, { useEffect, useRef, useState } from 'react';
import { Mutation } from 'react-apollo';
import Spinner from 'react-bootstrap/Spinner';

import { getMemberShiftAvailability } from '../utils';
import AuthCheck from './AuthCheck';
import QualificationBadge from './QualificationBadge';
import TeamBadge from './TeamBadge';

const SET_AVAILABLE_MUTATION = gql`
  mutation ($member: Int!, $date: Date!, $shift: Shift!, $available: Boolean!) {
    setAvailabilities(memberNumber: $member, availabilities: [{
      date: $date,
      shift: $shift,
      available: $available,
    }])
  }
`;

const EditableShiftCell = ({ member, date, defaultAvailable, shift }) => {
  const [previous, setPrevious] = useState();
  const [available, setAvailable] = useState(defaultAvailable);

  const classes = ['shift', `shift-${shift.toLowerCase()}`];

  if (available === true) {
    classes.push('table-success');
  } else if (available === false) {
    classes.push('table-danger');
  }

  const variables = {
    member: member.number,
    date: date.format('YYYY-MM-DD'),
    shift,
  };

  const handleError = () => {
    // TODO make this a bit prettier.
    alert('There was an error saving your availability');

    setAvailable(previous);
  };

  return (
    <Mutation
      mutation={SET_AVAILABLE_MUTATION}
      variables={variables}
      onError={err => handleError(err)}
    >
      {(mutate, { loading }) => {
        const handleChange = (checked) => {
          setPrevious(available);
          setAvailable(checked);

          mutate({ variables: { available: checked } });
        };

        return (
          <td className={classnames(classes)}>
            {loading ? (
              <Spinner animation='border' size='sm' />
            ) : (
              <label>
                <input
                  type='checkbox'
                  checked={available === true}
                  onChange={e => handleChange(e.target.checked)}
                />
              </label>
            )}

          </td>
        );
      }}
    </Mutation>
  );
}

const MemberRow = ({ member }) => (
  <tr>
    <td className='member' title={member.number}>{member.fullName}</td>
    <td className='team'><TeamBadge team={member.team} /></td>
    <td className='quals d-none d-xl-table-cell'>
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
                date={date}
                member={member}
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

function debounce(callback, interval) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    setTimeout(() => { timeout = undefined; }, interval);

    if (!timeout) {
      callback.apply(this, args);
    }
  };
};

const UnitTable = ({ members, from, to }) => {
  const days = [];

  for (const day = from.clone(); day <= to; day.add(1, 'days')) {
    days.push(day.clone());
  }

  // Summarise how many members we have available.
  const sum = getMemberShiftAvailability(from, []).map(({ shifts }) => (
    shifts.map(({ enabled }) => ({ enabled, sum: 0 }))
  ));

  for (const member of members) {
    for (let i = 0; i < member.shifts.length; ++i) {
      for (let j = 0; j < member.shifts[i].shifts.length; ++j) {
        if (member.shifts[i].shifts[j].available) {
          ++sum[i][j].sum;
        }
      }
    }
  }

  // Make the header and footer sticky.
  const table = useRef();
  const thead = useRef();
  const tfoot = useRef();

  useEffect(() => {
    const update = debounce(() => {
      const height = window.innerHeight;
      const bounds = table.current.getBoundingClientRect();

      if (bounds.top < 0) {
        thead.current.style.transform = `translateY(${-bounds.top}px) translateZ(0)`;
      } else {
        thead.current.style.transform = '';
      }

      if (bounds.bottom > height) {
        tfoot.current.style.transform = `translateY(${-bounds.bottom + height}px) translateZ(0)`;
      } else {
        tfoot.current.style.transform = '';
      }
    }, 10);

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);

    return () => {
      window.addEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  });

  return (
    <table className='table table-responsive table-sm unit-table' ref={table}>
      <thead ref={thead}>
        <tr>
          <th scope='col' className='member' rowSpan={2}>Member</th>
          <th scope='col' className='team' rowSpan={2}>Team</th>
          <th scope='col' className='quals d-none d-xl-table-cell' rowSpan={2}>Qualifications</th>
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
      <tfoot ref={tfoot}>
        <tr>
          <th scope='col' colSpan={3}>{members.length}</th>
          {sum.flat().map(({ enabled, sum }, i) => {
            if (!enabled) {
              return <th key={i}></th>
            }

            return <th key={i} className='shift'>{sum}</th>;
          })}
        </tr>
      </tfoot>
    </table>
  );
};

export default UnitTable;
