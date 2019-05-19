import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from 'react-router-bootstrap';

import { getDocumentTitle } from '../utils';

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
      </Card>
    </Container>
  )
}

export default Home;
