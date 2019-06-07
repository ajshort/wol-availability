import gql from 'graphql-tag';
import moment from 'moment';
import React, { useEffect } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { LinkContainer } from 'react-router-bootstrap';
import { FaMobileAlt } from 'react-icons/fa';

import QualificationBadge from '../components/QualificationBadge';
import TeamBadge from '../components/TeamBadge';
import { formatMobile, getDocumentTitle } from '../utils';

const AVAILABLE_MEMBERS_QUERY = gql`
  query ($instant: DateTime!) {
    membersAvailable(instant: $instant) {
      _id
      fullName
      surname
      mobile
      team
      qualifications
    }
  }
`;

const SHIFT_TEAMS_QUERY = gql`
  {
    shiftTeams {
      day
      night
    }
  }
`;

const ShiftTeamsAlert = () => (
  <Query query={SHIFT_TEAMS_QUERY}>
    {({ loading, error, data }) => (
      <Alert variant={error ? 'danger' : 'info'} className='mb-3'>
        {(() => {
          if (loading) {
            return (
              <><Spinner as='span' animation='border' size='sm' /> Loading shift teams&hellip;</>
            );
          }

          if (error) {
            return 'Error loading shift teams';
          }

          const { day, night } = data.shiftTeams;

          return (
            <><strong>{day}</strong> is day shift and <strong>{night}</strong> is night shift.</>
          );
        })()}
      </Alert>
    )}
  </Query>
);

const Home = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Home');
  });

  return (
    <Container className='my-3'>
      <ShiftTeamsAlert />
      <Card>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          Available Members
          <LinkContainer to='/member/me'>
            <Button variant='primary' size='sm'>
              My availability
            </Button>
          </LinkContainer>
        </Card.Header>
        <Query query={AVAILABLE_MEMBERS_QUERY} variables={{ instant: moment().format() }}>
          {({ loading, error, data }) => {
            if (loading) {
              return (
                <Card.Body>
                  <Spinner animation='border' size='sm' /> Loading available members&hellip;
                </Card.Body>
              );
            }

            if (error) {
              return (
                <Card.Body className='text-danger'>Error loading available members.</Card.Body>
              );
            }

            const members = data.membersAvailable.sort((a, b) => (
              a.surname.localeCompare(b.surname)
            ));

            if (!members || members.length === 0) {
              return <Card.Body>There are no members available.</Card.Body>;
            }

            return (
              <ListGroup variant='flush'>
                {members.map((member) => (
                  <ListGroup.Item key={member.number}>
                    <div className='d-flex align-items-center justify-content-between'>
                      <div>
                        {member.fullName}
                        <a className='ml-1' href={`tel:${member.mobile}`}>
                          <small>
                            <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(member.mobile)}</span>
                          </small>
                        </a>
                      </div>
                      <div className='text-right'>
                        <TeamBadge team={member.team} />
                        {member.qualifications.sort().map(qual => (
                          <QualificationBadge key={qual} qualification={qual} className='ml-1' />
                        ))}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )
          }}
        </Query>
      </Card>
    </Container>
  )
}

export default Home;
