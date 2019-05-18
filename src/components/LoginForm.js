import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState();
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <Form>
      <Form.Group controlId='member-number'>
        <Form.Label>Member number</Form.Label>
        <Form.Control
          type='number'
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId='password'>
        <Form.Label>Password</Form.Label>
        <Form.Control
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId='remember'>
        <Form.Check
          type='checkbox'
          label='Remember me?'
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
      </Form.Group>
      <Button type='submit' variant='primary' block>
        Login
      </Button>
    </Form>
  )
};

export default LoginForm;
