import React, { useEffect, useState } from 'react';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import { withRouter } from 'react-router-dom';

import QualificationsDropdown from '../components/QualificationsDropdown';
import UnitTable from '../components/UnitTable';
import { getDocumentTitle } from '../utils';

const Unit = withRouter(({ match }) => {
  const [qualifications, setQualifications] = useState([]);

  useEffect(() => {
    document.title = getDocumentTitle('Unit Availability');
  });

  return (
    <React.Fragment>
      <div className='d-flex justify-content-between align-items-center p-3'>
        <ButtonToolbar>
          <QualificationsDropdown
            id='qualifications-filter'
            selected={qualifications}
            onChange={setQualifications}
            variant='info'
            size='sm'
          />
        </ButtonToolbar>
      </div>
      <UnitTable />
    </React.Fragment>
  );
});

export default Unit;
