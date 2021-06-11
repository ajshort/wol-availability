import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import { getWeekInterval } from '../model/dates';
import { GET_MEMBERS_QUERY, GetMembersData, GetMembersVars } from '../queries/members';

import _ from 'lodash';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { Query } from '@apollo/client/react/components';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FaArrowRight } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';

const ChooseMember: React.FC = () => {
  const history = useHistory();
  const { member: me, unit } = useAuth();

  const currentWeek = getWeekInterval();
  const weeks = [];

  for (let i = 0; i < 4; ++i) {
    weeks.push(currentWeek.start.plus({ weeks: i }));
  }

  const [week, setWeek] = useState(currentWeek.start.toISODate());
  const [team, setTeam] = useState<string | undefined>(unit?.team);
  const [member, setMember] = useState(me?.number);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    history.push(`/member/${member}/${week}`);
  };

  return (
    <Page title='Member'>
      <Container className='my-3'>
        <Form onSubmit={handleSubmit}>
          <h1>Manage Availability</h1>
          <Form.Group controlId='week'>
            <Form.Label>Enter availability for the week of</Form.Label>
            <Form.Control
              as='select'
              className='custom-select'
              value={week}
              onChange={e => setWeek(e.target.value)}
            >
              {weeks.map(week => (
                <option key={week.toISODate()} value={week.toISODate()}>
                  {week.toLocaleString(DateTime.DATE_HUGE)}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Query<GetMembersData, GetMembersVars>
            query={GET_MEMBERS_QUERY}
            variables={{ unit: unit!.code }}
          >
            {({ loading, error, data }) => {
              if (loading) {
                return <p><Spinner as='span' animation='border' size='sm' /> Loading&hellip;</p>;
              }

              if (error || !data) {
                return <Alert variant='danger'>Error loading members</Alert>;
              }

              if (unit?.permission === 'EDIT_SELF') {
                return null;
              }

              // const teams = _.uniq(data.members.map(member => member.team)).sort();

              console.log(data.unit.members);

              const members = data.unit.members
                // .filter(member => !team || team === member.team)
                .slice()
                .sort((a, b) => a.lastName.localeCompare(b.lastName));

              return (
                <React.Fragment>
                  {unit!.permission === 'EDIT_UNIT' && (
                    <Form.Group controlId='week'>
                      <Form.Label>What team are you in?</Form.Label>
                      <Form.Control
                        as='select'
                        className='custom-select'
                        value={team}
                        onChange={e => setTeam(e.target.value)}
                      >
                        <option></option>
                        {/* teams.sort().map(team => <option key={team}>{team}</option>) */}
                      </Form.Control>
                    </Form.Group>
                  )}
                  <Form.Group controlId='member'>
                    <Form.Label>Who are you?</Form.Label>
                    <Form.Control
                      as='select'
                      className='custom-select'
                      value={member}
                      onChange={e => setMember(e.target.value ? parseInt(e.target.value, 10) : 0)}
                    >
                      <option></option>
                      {members.map(member => (
                        <option key={member.number} value={member.number}>{member.fullName}</option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </React.Fragment>
              );
            }}
          </Query>
          <Button type='submit' variant='primary' className='ml-auto' disabled={!(week && member)}>
            Next <FaArrowRight />
          </Button>
        </Form>
      </Container>
    </Page>
  );
};

export default ChooseMember;
