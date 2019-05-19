import React from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { Redirect, Route } from 'react-router-dom';

import { AuthConsumer } from './AuthContext';

const ProtectedRoute = (props) => (
  <AuthConsumer>
    {({ loading, member }) => {
      if (loading) {
        return (
          <div className='d-flex justify-content-center my-3'>
            <Spinner animation='border' />
          </div>
        );
      }

      return member ? <Route {...props} /> : <Redirect to='/login' />;
    }}
  </AuthConsumer>
);

export default ProtectedRoute;
