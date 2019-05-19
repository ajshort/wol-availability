import React, { useContext, useEffect } from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

import AuthContext from '../components/AuthContext';
import { getDocumentTitle, getWeekStart } from '../utils';

const MePage = () => {
  const { member } = useContext(AuthContext);
  const week = getWeekStart().format('YYYY-MM-DD');

  return <Redirect to={`/member/${member.number}/${week}`} />;
};

const Member = ({ match }) => {
  useEffect(() => {
    document.title = getDocumentTitle('Member Availability');
  });

  return (
    <Switch>
      <Route path={`${match.path}/:member/:week`} />
      <Route path={`${match.path}/me`} component={MePage} />
      <Route path={`${match.path}/`} />
    </Switch>
  )
}

export default withRouter(Member);
