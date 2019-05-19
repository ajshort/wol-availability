import React, { useEffect } from 'react';

import { getDocumentTitle } from '../utils';

const Unit = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Unit Availability');
  });

  return '';
}

export default Unit;
