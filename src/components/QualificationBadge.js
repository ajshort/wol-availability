import { QUALIFICATIONS } from '../model/qualifications';

import clsx from 'clsx';
import React from 'react';
import Badge from 'react-bootstrap/Badge';

const QualificationBadge = ({ qualification, className, member }) => {
  const entry = QUALIFICATIONS[qualification];

  if (!entry) {
    return null;
  }

  const { name, abbreviation } = entry;

  // Add W or S tags to SWD.
  const storm = (qualification === 'SWDG-ACC' || qualification === 'SWDH-ACC');

  if (storm && (member.qualifications.includes('HSK-W Heights Operator') || member.qualifications.includes('HSK-W Ground Operator'))) {
    return (
      <span className={clsx('qual-badge-combined', className)}>
        <Badge className={clsx('qual-badge', `qual-badge-${abbreviation.toLowerCase()}`)}>
          <abbr title={name}>{abbreviation}</abbr>
        </Badge>
        <Badge className='qual-badge qual-badge-hskw'>
          W
        </Badge>
      </span>
    );
  } else if (storm && (member.qualifications.includes('HSK-S Heights Operator') || member.qualifications.includes('HSK-S Ground Operator'))) {
    return (
      <span className={clsx('qual-badge-combined', className)}>
        <Badge className={clsx('qual-badge', `qual-badge-${abbreviation.toLowerCase()}`)}>
          <abbr title={name}>{abbreviation}</abbr>
        </Badge>
        <Badge className='qual-badge qual-badge-hskw'>
          S
        </Badge>
      </span>
    );
  }

  return (
    <Badge className={clsx('qual-badge', `qual-badge-${abbreviation.toLowerCase()}`, className)}>
      <abbr title={name}>{abbreviation}</abbr>
    </Badge>
  );
};

export default QualificationBadge;
