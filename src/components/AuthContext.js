import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from 'graphql-tag';
import React, { useState } from 'react';
import { ApolloProvider, Query } from 'react-apollo';

const AuthContext = React.createContext({
  member: undefined,
  loading: false,
  error: undefined,
  login: () => { throw new Error('no auth provider') },
  logout: () => { throw new Error('no auth provider') },
});

const LOGGED_IN_MEMBERY_QUERY = gql`
  {
    member: loggedInMember {
      number
      fullName
      permission
      team
    }
  }
`;

export const AuthProvider = ({ children }) => {
  // The only state is the auth token - we use this to create an ApolloClient and query the server
  // for member details.
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Create an apollo client using the bearer token.
  const httpLink = createHttpLink({
    uri: process.env.REACT_APP_API_URI,
  });

  const authLink = setContext((_operation, { headers }) => {
    const authorization = token ? `Bearer ${token}` : '';

    return {
      headers: { authorization, ...headers }
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });

  // Exposed functions.
  const login = (token, remember) => {
    setToken(token);

    if (remember) {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setToken(token);
    localStorage.removeItem('token');
  };

  return (
    <ApolloProvider client={client}>
      <Query query={LOGGED_IN_MEMBERY_QUERY} skip={!token}>
        {({ loading, error, data }) => {
          const value = { loading, error, login, logout };

          if (data) {
            value.member = data.member;
          }

          return (
            <AuthContext.Provider value={value}>
              {children}
            </AuthContext.Provider>
          );
        }}
      </Query>
    </ApolloProvider>
  )
};

export const AuthConsumer = AuthContext.Consumer;

export default AuthContext;
