import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';

import QualificationsDropdown from '../components/QualificationsDropdown';
import TeamSelect from '../components/TeamSelect';
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
        <div className='d-flex align-items-center'>
          <label>Team</label>
          <TeamSelect size='sm' className='mr-1 custom-select' />
          <label>Qualifications</label>
          <QualificationsDropdown
            id='qualifications-filter'
            selected={qualifications}
            onChange={setQualifications}
            variant='info'
          />
        </div>
      </div>
      <UnitTable qualifications={qualifications} />
    </React.Fragment>
  );
});

export default Unit;
