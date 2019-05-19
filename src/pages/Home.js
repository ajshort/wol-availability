import gql from 'graphql-tag';
import moment from 'moment';
import React, { useEffect } from 'react';
import { Query } from 'react-apollo';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { LinkContainer } from 'react-router-bootstrap';

import { getDocumentTitle } from '../utils';

const AVAILABLE_MEMBERS_QUERY = gql`
  query ($instant: DateTime!) {
    membersAvailable(instant: $instant) {
      fullName
      surname
    }
  }
`;

const Home = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Home');
  });

  return (
    <Container className='my-3'>
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
                  <ListGroup.Item>{member.fullName}</ListGroup.Item>
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
