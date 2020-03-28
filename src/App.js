import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Analytics from './components/Analytics';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import DutyOfficer from './pages/DutyOfficer';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Member from './pages/Member';
import Stats from './pages/Stats';
import Unit from './pages/Unit';

const App = () => (
  <AuthProvider>
    <Router>
      <Analytics ua='UA-9943914-7'>
        <Header />
        <Switch>
          <ProtectedRoute path='/' exact component={Home} />
          <ProtectedRoute path='/member' component={Member} />
          <ProtectedRoute path='/unit/storm/:week?' component={Unit} />
          <ProtectedRoute path='/unit/do/:week?' component={DutyOfficer} />
          <ProtectedRoute path='/stats/:week?' component={Stats} />
          <Route path='/login' component={Login} />
          <Route path='/logout' component={Logout} />
        </Switch>
      </Analytics>
    </Router>
  </AuthProvider>
);

export default App;
