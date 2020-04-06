import React from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { Redirect } from 'react-router';

import { AuthConsumer } from '../components/AuthContext';
import LoginForm from '../components/LoginForm';
import Page from '../components/Page';

const Login = () => (
  <Page title='Log In'>
    <AuthConsumer>
      {({ loading, member }) => {
        if (loading) {
          return (
            <div className='d-flex justify-content-center my-3'>
              <Spinner animation='border' />
            </div>
          );
        }

        if (member) {
          return <Redirect to='/' />;
        }

        return (
          <Container className='Login'>
            <LoginForm />
          </Container>
        );
      }}
    </AuthConsumer>
  </Page>
);

export default Login;
