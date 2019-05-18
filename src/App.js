import ApolloClient from 'apollo-boost';
import React from 'react';
import { ApolloProvider } from 'react-apollo';

import Header from './components/Header';

const client = new ApolloClient({ uri: process.env.REACT_APP_API_URI })

const App = () => (
  <ApolloProvider client={client}>
    <Header />
  </ApolloProvider>
);

export default App;
