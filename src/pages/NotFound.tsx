import Page from '../components/Page';

import React from 'react';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

const NotFound: React.FC = () => (
  <Page title='Not Found'>
    <Container className='my-3'>
      <Alert variant='danger'>
        <Alert.Heading>404 Not Found</Alert.Heading>
        <p className='mb-0'>
          The page you requested could not be found.
        </p>
      </Alert>
    </Container>
  </Page>
);

export default NotFound;
