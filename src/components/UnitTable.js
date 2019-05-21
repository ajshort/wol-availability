import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
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

const UnitTable = ({ qualifications = [] }) => (
  <Query query={MEMBERS_QUERY}>
    {({ loading, error, data }) => {
      if (loading) {
        return (
          <Alert variant='info' className='mx-3'>
            <Spinner animation='border' size='sm' /> Loading members&hellip;
          </Alert>
        );
      }

      if (error) {
        return <Alert variant='danger' className='mx-3'>Error loading members.</Alert>;
      }

      const members = data.members
        .filter(member => {
          for (let qualification of qualifications) {
            if (!member.qualifications.includes(qualification)) {
              return false;
            }
          }

          return true;
        })
        .sort((a, b) => (
          a.team.localeCompare(b.team) || a.surname.localeCompare(b.surname)
        ));

      return (
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
            <th scope='col'>{members.length}</th>
            <th scope='col'></th>
            <th scope='col'></th>
          </tfoot>
        </Table>
      );
    }}
  </Query>
);

export default UnitTable;
