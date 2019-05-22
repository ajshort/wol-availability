import React from 'react';

import { AuthConsumer } from './AuthContext';

const AuthCheck = ({ children, target }) => (
  <AuthConsumer>
    {({ member }) => {
      let allowed = false;

      if (member.number === target.number) {
        allowed = true;
      } else if (member.permission === 'EDIT_UNIT') {
        allowed = true;
      } else if (member.permission === 'EDIT_TEAM') {
        allowed = (member.team === target.team);
      }

      return children(allowed);
    }}
  </AuthConsumer>
);

export default AuthCheck;
