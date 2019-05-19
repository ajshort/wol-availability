import gql from 'graphql-tag';
import React, { useState } from 'react';
import { Mutation } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

const LOGIN_MUTATION = gql`
  mutation ($memberNumber: Int!, $password: String!) {
    login(memberNumber: $memberNumber, password: $password) {
      token
      member {
        number
        fullName
        permission
        team
      }
    }
  }
`;

const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState(0);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (event, loginMutation) => {
    event.preventDefault();
    event.stopPropagation();

    loginMutation();
  };

  const handleCompleted = ({ login }) => {
  };

  return (
    <Mutation
      mutation={LOGIN_MUTATION}
      variables={{ memberNumber, password }}
      onCompleted={handleCompleted}
    >
      {(login, { loading, error }) => (
        <Form onSubmit={event => handleSubmit(event, login)}>
          {error && (
            <Alert variant='danger'>Invalid login details.</Alert>
          )}
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

export default LoginForm;
