import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import { AuthProvider } from './components/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Member from './pages/Member';
import Unit from './pages/Unit';

const App = () => (
  <AuthProvider>
    <Router>
      <Header />
      <Switch>
        <Route path='/' exact component={Home} />
        <Route path='/member' component={Member} />
        <Route path='/unit' component={Unit} />
        <Route path='/login' component={Login} />
      </Switch>
    </Router>
  </AuthProvider>
);

export default App;
