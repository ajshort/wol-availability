import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import { withRouter } from 'react-router-dom';

import { AuthConsumer } from '../components/AuthContext';

const AnalyticsContent = ({ children, history, location, loading, member }) => {
  useEffect(() => {
    ReactGA.set({ userId: member ? member.number : undefined });
  }, [member]);

  useEffect(() => {
    if (!loading) {
      ReactGA.pageview(location.pathname);
      history.listen(location => ReactGA.pageview(location.pathname));
    }
  }, [loading]);

  return children;
};

const Analytics = ({ children, history, location, ua }) => {
  useEffect(() => {
    ReactGA.initialize(ua);
  }, [ua]);

  return (
    <AuthConsumer>
      {({ loading, member }) => {
        if (loading) {
          return children;
        }

        return (
          <AnalyticsContent
            children={children}
            history={history}
            location={location}
            loading={loading}
            member={member}
          />
        );
      }}
    </AuthConsumer>
  );
};

export default withRouter(Analytics);
