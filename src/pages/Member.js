import gql from 'graphql-tag';
import React, { useContext, useEffect } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

import AuthCheck from '../components/AuthCheck';
import AuthContext from '../components/AuthContext';
import MemberAvailabilityForm from '../components/MemberAvailabilityForm';
import { getDocumentTitle, getWeekStart } from '../utils';

const MePage = () => {
  const { member } = useContext(AuthContext);
  const week = getWeekStart().format('YYYY-MM-DD');

  return <Redirect to={`/member/${member.number}/${week}`} />;
};

const MEMBER_QUERY = gql`
  query ($number: Int!) {
    member(number: $number) {
      _id
      number
      fullName
      team
      qualifications
    }
  }
`;

const MemberPage = ({ match }) => {
  const number = parseInt(match.params.member);
  const week = match.params.week;

  return (
    <Container className='my-3'>
      <Query query={MEMBER_QUERY} variables={{ number, week }}>
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <Alert variant='info'>
                <Spinner animation='border' size='sm' /> Loading member&hellip;
              </Alert>
            );
          }

          if (error) {
            return <Alert variant='danger'>Error loading member.</Alert>;
          }

          const { member } = data;

          if (!member) {
            return <Alert variant='danger'>The requested member was not found.</Alert>;
          }

          return (
            <AuthCheck target={member}>
              {authorised => {
                if (!authorised) {
                  return (
                    <Alert variant='danger'>You are not authorised to manage this member.</Alert>
                  );
                }

                return <MemberAvailabilityForm member={member} />;
              }}
            </AuthCheck>
          );
        }}
      </Query>
    </Container>
  );
};

const Member = ({ match }) => {
  useEffect(() => {
    document.title = getDocumentTitle('Member Availability');
  });

  return (
    <Switch>
      <Route path={`${match.path}/me`} component={MePage} />
      <Route path={`${match.path}/:member/:week`} component={MemberPage} />
      <Route path={`${match.path}/`} />
    </Switch>
  )
}

export default withRouter(Member);
