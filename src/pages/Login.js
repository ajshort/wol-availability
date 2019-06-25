import React, { useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { Redirect } from 'react-router';

import { AuthConsumer } from '../components/AuthContext';
import LoginForm from '../components/LoginForm';
import { getDocumentTitle } from '../utils';

const Login = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Login');
  });

  return (
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
  );
};

export default Login;
