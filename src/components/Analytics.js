import { useEffect } from 'react';
import ReactGA from 'react-ga';
import { withRouter } from 'react-router-dom';

const Analytics = ({ children, history, location, ua }) => {
  const view = (location) => {
    console.log(location.pathname);
    ReactGA.pageview(location.pathname);
  };

  useEffect(() => {
    ReactGA.initialize(ua);
    view(location);

    history.listen(view);
  }, []);

  return children;
};

export default withRouter(Analytics);
