import React, { useEffect } from 'react';
import Container from 'react-bootstrap/Container';

import LoginForm from '../components/LoginForm';
import { getDocumentTitle } from '../utils';

const Login = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Login');
  });

  return (
    <Container className='Login'>
      <LoginForm />
    </Container>
  );
};

export default Login;
