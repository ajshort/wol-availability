import gql from 'graphql-tag';
import React, { useContext, useState } from 'react';
import { Mutation } from '@apollo/client/react/components';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { withRouter } from 'react-router-dom';

import AuthContext from './AuthContext';

const LOGIN_MUTATION = gql`
  mutation ($memberNumber: Int!, $password: String!) {
    login(memberNumber: $memberNumber, password: $password) {
      token
    }
  }
`;

const LoginForm = ({ location, history }) => {
  const { login } = useContext(AuthContext);

  const [memberNumber, setMemberNumber] = useState(0);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (event, loginMutation) => {
    event.preventDefault();
    event.stopPropagation();

    loginMutation();
  };

  const handleCompleted = (data) => {
    login(data.login.token, remember);

    if (location.state && location.state.redirectTo) {
      history.push(location.state.redirectTo);
    } else {
      history.push('/');
    }
  };

  return (
    <Mutation
      mutation={LOGIN_MUTATION}
      variables={{ memberNumber, password }}
      onCompleted={handleCompleted}
    >
      {(loginMutation, { loading, error }) => (
        <Form onSubmit={e => handleSubmit(e, loginMutation)}>
          {error && (
            (error.networkError ? (
              <Alert variant='danger'>There was a network error tying to sign in.</Alert>
            ) : (
              <Alert variant='danger'>Invalid member number and/or password.</Alert>
            ))
          )}
          <Alert variant='info' className='mb-3'>
            Please note that from August, this application will be used for Vertical Rescue
            {' '}
            <strong>only</strong>. All other availability will be managed using
            {' '}
            <a href='https://membersesnswgov.sharepoint.com/sites/mySES-Availability'>myAvailability</a>.
          </Alert>
          <Form.Group controlId='member-number'>
            <Form.Label>Member number</Form.Label>
            <Form.Control
              type='number'
              required
              value={memberNumber || ''}
              onChange={e => setMemberNumber(parseInt(e.target.value, 10))}
            />
          </Form.Group>
          <Form.Group controlId='password'>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type='password'
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Form.Text className='text-muted'>
              Your default password is capital W followed by your member number.
            </Form.Text>
          </Form.Group>
          <Form.Group controlId='remember'>
            <Form.Check
              type='checkbox'
              label='Remember me?'
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
          </Form.Group>
          <Button type='submit' variant='primary' block disabled={loading}>
            {loading ? (
              <><Spinner animation='border' size='sm' /> Logging in&hellip;</>
            ) : (
              'Login'
            )}
          </Button>
        </Form>
      )}
    </Mutation>
  )
};

export default withRouter(LoginForm);
