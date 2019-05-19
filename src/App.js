import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Member from './pages/Member';
import Unit from './pages/Unit';

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_API_URI,
});

const authLink = setContext((_operation, { headers }) => {
  const token = localStorage.getItem('token');
  const authorization = token ? `Bearer ${token}` : '';

  return {
    headers: { authorization, ...headers }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

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
