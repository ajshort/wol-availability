import{ useContext, useEffect } from 'react';
import { withRouter } from 'react-router-dom';

import AuthContext from '../components/AuthContext';

const Logout = ({ history }) => {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    logout();
    history.replace('/login');
  });

  return null;
};

export default withRouter(Logout);
