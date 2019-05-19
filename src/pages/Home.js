import React, { useEffect } from 'react';

import { getDocumentTitle } from '../utils';

const Home = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Home');
  });

  return '';
}

export default Home;
