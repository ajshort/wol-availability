import React from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { Redirect, Route, withRouter } from 'react-router-dom';

import { AuthConsumer } from './AuthContext';

const ProtectedRoute = withRouter((props) => (
  <AuthConsumer>
    {({ loading, member }) => {
      if (loading) {
        return (
          <div className='d-flex justify-content-center my-3'>
            <Spinner animation='border' />
          </div>
        );
      }

      if (!member) {
        const to = {
          pathname: '/login',
          state: { redirectTo: props.location }
        };

        return <Redirect to={to} />;
      }

      return <Route {...props} />;
    }}
  </AuthConsumer>
));

export default ProtectedRoute;
