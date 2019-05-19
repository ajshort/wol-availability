import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Member from './pages/Member';
import Unit from './pages/Unit';

const App = () => (
  <AuthProvider>
    <Router>
      <Header />
      <Switch>
        <ProtectedRoute path='/' exact component={Home} />
        <ProtectedRoute path='/member' component={Member} />
        <ProtectedRoute path='/unit' component={Unit} />
        <Route path='/login' component={Login} />
        <Route path='/logout' component={Logout} />
      </Switch>
    </Router>
  </AuthProvider>
);

export default App;
