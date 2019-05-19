import ApolloClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Member from './pages/Member';
import Unit from './pages/Unit';


const client = new ApolloClient({ uri: process.env.REACT_APP_API_URI })

const App = () => (
  <ApolloProvider client={client}>
    <Router>
      <Header />
      <Switch>
        <Route path='/' exact component={Home} />
        <Route path='/member' component={Member} />
        <Route path='/unit' component={Unit} />
        <Route path='/login' component={Login} />
      </Switch>
    </Router>
  </ApolloProvider>
);

export default App;
