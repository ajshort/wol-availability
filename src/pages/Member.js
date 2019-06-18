import gql from 'graphql-tag';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

import AuthCheck from '../components/AuthCheck';
import AuthContext from '../components/AuthContext';
import MemberAvailabilityForm from '../components/MemberAvailabilityForm';
import { WEEK_START_DAY } from '../config';
import { getDocumentTitle, getWeekStart, getWeekEnd } from '../utils';

const MePage = () => {
  const { member } = useContext(AuthContext);
  const week = getWeekStart().format('YYYY-MM-DD');

  return <Redirect to={`/member/${member.number}/${week}`} />;
};

const MEMBER_AVAILABILITY_QUERY = gql`
  query ($number: Int!, $from: Date!, $to: Date!) {
    member(number: $number) {
      _id
      number
      fullName
      team
      qualifications
      availabilities(from: $from, to: $to) {
        date
        shift
        available
      }
    }
  }
`;

const WeekPage = ({ match }) => {
  const number = parseInt(match.params.member);
  const start = moment(match.params.week, 'YYYY-MM-DD');
  const end = getWeekEnd(start);

  if (start.day() !== WEEK_START_DAY) {
    return (
      <Alert variant='danger' className='m-3'>Invalid week.</Alert>
    );
  }

  const variables = {
    number,
    from: start.format('YYYY-MM-DD'),
    to: end.format('YYYY-MM-DD'),
  };

  return (
    <Query query={MEMBER_AVAILABILITY_QUERY} variables={variables} fetchPolicy='network-only'>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <Alert variant='info'>
              <Spinner animation='border' size='sm' /> Loading member&hellip;
            </Alert>
          );
        }

        if (error || !data.member) {
          return <Alert variant='danger'>Error loading member.</Alert>;
        }

        return (
          <AuthCheck target={data.member}>
            {authorised => {
              if (!authorised) {
                return (
                  <Alert variant='danger'>You are not authorised to manage this member.</Alert>
                );
              }

              const { member } = data;

              const prevWeek = `/member/${number}/${start.clone().subtract(1, 'week').format('YYYY-MM-DD')}`;
              const nextWeek = `/member/${number}/${start.clone().add(1, 'week').format('YYYY-MM-DD')}`;

              return (
                <React.Fragment>
                  <h1 className='h3 text-center'>{member.fullName}</h1>
                  <div className='d-flex justify-content-center align-items-center my-3'>
                    <LinkContainer to={prevWeek}>
                      <Button variant='secondary'><FaArrowLeft /></Button>
                    </LinkContainer>
                    <strong className='mx-1'>{start.format('Do MMM YYYY')}</strong>
                    <LinkContainer to={nextWeek}>
                      <Button variant='secondary'><FaArrowRight /></Button>
                    </LinkContainer>
                  </div>
                  <MemberAvailabilityForm member={data.member} week={start} />
                </React.Fragment>
              );
            }}
          </AuthCheck>
        );
      }}
    </Query>
  );
};

const MEMBERS_QUERY = gql`
  {
    members {
      _id
      number
      fullName
      surname
      team
    }

    teams
  }
`;

const MemberPage = withRouter(({ history }) => {
  const auth = useContext(AuthContext);

  const currentWeek = getWeekStart();
  const weeks = [];

  for (let i = 0; i < 4; ++i) {
    weeks.push(currentWeek.clone().add(i, 'weeks'));
  }

  const [week, setWeek] = useState(currentWeek.format('YYYY-MM-DD'));
  const [team, setTeam] = useState(auth.member.team);
  const [member, setMember] = useState(auth.member.number);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    history.push(`/member/${member}/${week}`);
  };

  return (
    <Query query={MEMBERS_QUERY} skip={auth.member.permission === 'EDIT_SELF'}>
      {({ loading, error, data }) => (
        <Form onSubmit={handleSubmit}>
          <h1>Manage Availability</h1>
          <p className='lead'>
            Enter and update your availability for storm and support callouts.
          </p>
          <Form.Group controlId='week'>
            <Form.Label>Enter availability for the week of</Form.Label>
            <Form.Control as='select' value={week} onChange={e => setWeek(e.target.value)}>
              {weeks.map(week => (
                <option key={week.unix()} value={week.format('YYYY-MM-DD')}>
                  {week.format('dddd Do MMM YYYY')}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          {(() => {
            if (loading) {
              return <p><Spinner as='span' animation='border' size='sm' /> Loading&hellip;</p>;
            }

            if (error) {
              return <Alert variant='danger'>Error loading members</Alert>;
            }

            if (auth.member.permission === 'EDIT_SELF') {
              return;
            }

            const members = data.members
              .filter(member => !team || team === member.team)
              .sort((a, b) => a.surname.localeCompare(b.surname));

            return (
              <React.Fragment>
                {auth.member.permission === 'EDIT_UNIT' && (
                  <Form.Group controlId='week'>
                    <Form.Label>What team are you in?</Form.Label>
                    <Form.Control as='select' value={team} onChange={e => setTeam(e.target.value)}>
                      <option></option>
                      {data.teams.sort().map(team => (
                        <option key={team}>{team}</option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                )}
                <Form.Group controlId='member'>
                  <Form.Label>Who are you?</Form.Label>
                  <Form.Control as='select' value={member} onChange={e => setMember(e.target.value)}>
                    <option></option>
                    {members.map(member => (
                      <option key={member.number} value={member.number}>{member.fullName}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </React.Fragment>
            );
          })()}
          <div className='d-flex'>
            <Button type='submit' variant='primary' className='ml-auto' disabled={!(week && member)}>
              Next <FaArrowRight />
            </Button>
          </div>
        </Form>
      )}
    </Query>
  )
});

const Member = ({ match }) => {
  useEffect(() => {
    document.title = getDocumentTitle('Member Availability');
  });

  return (
    <Container className='my-3'>
      <Switch>
        <Route path={`${match.path}/me`} exact component={MePage} />
        <Route path={`${match.path}/:member/:week`} component={WeekPage} />
        <Route path={`${match.path}/`} exact component={MemberPage} />
      </Switch>
    </Container>
  );
};

export default withRouter(Member);
