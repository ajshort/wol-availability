import { ApolloClient, ApolloError } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from 'graphql-tag';
import React, { useContext, useState } from 'react';
import { ApolloProvider, Query } from 'react-apollo';

interface LoggedInMember {
  number: number;
  fullName: string;
  permission: 'EDIT_SELF' | 'EDIT_TEAM' | 'EDIT_UNIT';
  team: string;
  unit: string;
}

interface AuthContextProps {
  member?: LoggedInMember;
  loading: boolean;
  error?: ApolloError;
  login: (token: string, remember: boolean) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextProps>({
  member: undefined,
  loading: false,
  login: () => { throw new Error('no auth provider') },
  logout: () => { throw new Error('no auth provider') },
});

interface LoggedInMemberData {
  loggedInMember: LoggedInMember | null;
}

const LOGGED_IN_MEMBERY_QUERY = gql`
  {
    loggedInMember {
      number
      fullName
      permission
      team
      unit
    }
  }
`;

export const AuthProvider: React.FC = ({ children }) => {
  // The only state is the auth token - we use this to create an ApolloClient and query the server
  // for member details.
  const [token, setToken] = useState<string | undefined>(localStorage.getItem('token') || undefined);

  // Create an apollo client using the bearer token.
  const httpLink = createHttpLink({
    uri: process.env.REACT_APP_API_URI || 'https://wol-api.ajshort.now.sh/graphql',
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
  const login = (token: string, remember: boolean) => {
    setToken(token);

    if (remember) {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setToken(undefined);
    localStorage.removeItem('token');
  };

  return (
    <ApolloProvider client={client}>
      <Query<LoggedInMemberData> query={LOGGED_IN_MEMBERY_QUERY} skip={!token}>
        {({ loading, error, data }) => {
          const value: AuthContextProps = { loading, error, login, logout };

          if (data && data.loggedInMember) {
            value.member = data.loggedInMember;
          }

          // If there's an error (e.g. expired token), logout to clear it.
          if (error && token) {
            logout();
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

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
