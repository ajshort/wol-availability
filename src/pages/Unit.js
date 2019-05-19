import React, { useEffect } from 'react';

import UnitTable from '../components/UnitTable';
import { getDocumentTitle } from '../utils';

const Unit = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Unit Availability');
  });

  return (
    <UnitTable />
  );
}

export default Unit;
