import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Analytics from './components/Analytics';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DutyOfficer from './pages/DutyOfficer';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import ManageMember from './pages/ManageMember';
import NotFound from './pages/NotFound';
import { FloodRescue, VerticalRescue } from './pages/Rescue';
import Stats from './pages/Stats';
import Storm from './pages/Storm';

const App = () => (
  <AuthProvider>
    <Router>
      <Analytics ua='UA-9943914-7'>
        <Switch>
          <ProtectedRoute path='/' exact component={Home} />
          <ProtectedRoute path='/member/:member/:week?' component={ManageMember} />
          <ProtectedRoute path='/unit/storm/:week?' component={Storm} />
          <ProtectedRoute path='/unit/fr/:week?' component={FloodRescue} />
          <ProtectedRoute path='/unit/vr/:week?' component={VerticalRescue} />
          <ProtectedRoute path='/unit/do/:week?' component={DutyOfficer} />
          <ProtectedRoute path='/stats/:week?' component={Stats} />
          <Route path='/login' component={Login} />
          <Route path='/logout' component={Logout} />
          <Route component={NotFound} />
        </Switch>
      </Analytics>
    </Router>
  </AuthProvider>
);

export default App;
