import { ApolloClient, ApolloError, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { setContext } from '@apollo/client/link/context';
import gql from 'graphql-tag';
import React, { useContext, useState } from 'react';

interface Unit {
  code: string;
  name: string;
}

export interface LoggedInMember {
  number: number;
  fullName: string;
  preferredName: string | null;
  permission: 'EDIT_SELF' | 'EDIT_TEAM' | 'EDIT_UNIT';
  units: Unit[];
}

interface AuthContextProps {
  member?: LoggedInMember;
  unit?: Unit;
  loading: boolean;
  error?: ApolloError;
  login: (token: string, remember: boolean) => void;
  logout: () => void;
  setUnit: (code: string) => void;
};

const AuthContext = React.createContext<AuthContextProps>({
  loading: false,
  login: () => { throw new Error('no auth provider') },
  logout: () => { throw new Error('no auth provider') },
  setUnit: () => { return; },
});

interface LoggedInMemberData {
  loggedInMember: LoggedInMember | null;
}

const LOGGED_IN_MEMBERY_QUERY = gql`
  {
    loggedInMember {
      number
      fullName
      preferredName
      permission
      units {
        code
        name
      }
    }
  }
`;

export const AuthProvider: React.FC = ({ children }) => {
  // The only state is the auth token - we use this to create an ApolloClient and query the server
  // for member details.
  const [token, setToken] = useState<string | undefined>(localStorage.getItem('token') || undefined);
  const [unitCode, setUnitCode] = useState<string | undefined>(localStorage.getItem('unitCode') || undefined);

  // Create an apollo client using the bearer token.
  const httpLink = createHttpLink({
    uri: process.env.REACT_APP_API_URI || 'https://wol-api-ajshort.vercel.app/graphql',
  });

  const authLink = setContext((_operation, { headers }) => {
    const authorization = token ? `Bearer ${token}` : '';

    return {
      headers: { authorization, ...headers }
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
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
    localStorage.removeItem('unitCode');
  };

  const setUnit = (code: string) => {
    setUnitCode(code);
    localStorage.setItem('unitCode', code);
  };

  return (
    <ApolloProvider client={client}>
      <Query<LoggedInMemberData> query={LOGGED_IN_MEMBERY_QUERY} skip={!token}>
        {({ loading, error, data }) => {
          const value: AuthContextProps = {
            loading,
            error,
            login,
            logout,
            setUnit,
          };

          if (data && data.loggedInMember) {
            value.member = data.loggedInMember;

            // If there's no current unit, set it to the first one.
            if (unitCode) {
              value.unit = value.member!.units.find(u => u.code === unitCode);
            }

            if (!value.unit) {
              value.unit = value.member!.units[0];
            }
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
