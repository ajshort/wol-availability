import ApolloClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from './components/Header';
import Login from './pages/Login';

const client = new ApolloClient({ uri: process.env.REACT_APP_API_URI })

const App = () => (
  <ApolloProvider client={client}>
    <Header />
    <Router>
      <Switch>
        <Route path='/login' component={Login} />
      </Switch>
    </Router>
  </ApolloProvider>
);

export default App;
