import gql from 'graphql-tag';
import React, { useState } from 'react';
import { Query } from 'react-apollo';
import Form from 'react-bootstrap/Form';

import TeamBadge from './TeamBadge';

const TEAMS_QUERY = gql`
  {
    teams
  }
`;

const TeamSelect = ({ team = undefined, onChange = () => {}, ...props }) => (
  <Query query={TEAMS_QUERY}>
    {({ loading, error, data }) => {
      if (loading) {
        return 'LOADING';
      }

      if (error) {
        return 'ERROR';
      }

      const teams = data.teams.sort();

      return (
        <Form.Control as='select' {...props}>
          <option></option>
          {teams.map(team => <option key={team}>{team}</option>)}
        </Form.Control>
      )
    }}
  </Query>
);

export default TeamSelect;
