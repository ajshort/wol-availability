import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import Spinner from 'react-bootstrap/Spinner';
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
);

const MEMBERS_QUERY = gql`
  {
    members {
      _id
      number
      fullName
      surname
      team
      qualifications
    }
  }
`;

const UnitTable = () => (
  <Table size='sm'>
    <thead>
      <tr>
        <th scope='col'>Member</th>
        <th scope='col'>Team</th>
        <th scope='col'>Qualifications</th>
      </tr>
    </thead>
    <tbody>
      <Query query={MEMBERS_QUERY}>
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <tr>
                <td colSpan={3}>
                  <Spinner animation='border' size='sm' /> Loading members&hellip;
                </td>
              </tr>
            );
          }

          if (error) {
            return (
              <tr>
                <td colSpan={3} className='text-danger'>Error loading members.</td>
              </tr>
            );
          }

          return data.members
            .sort((a, b) => {
              return a.team.localeCompare(b.team) ||
                     a.surname.localeCompare(b.surname)
            })
            .map(member => <MemberRow key={member.number} member={member} />);
        }}
      </Query>
    </tbody>
  </Table>
);

export default UnitTable;
