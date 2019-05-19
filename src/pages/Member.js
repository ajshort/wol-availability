import React, { useEffect } from 'react';

import { getDocumentTitle } from '../utils';

const Member = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Member Availability');
  });

  return '';
}

export default Member;
