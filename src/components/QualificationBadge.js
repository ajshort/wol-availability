import { QUALIFICATIONS } from '../model/qualifications';

import clsx from 'clsx';
import React from 'react';
import Badge from 'react-bootstrap/Badge';

const QualificationBadge = ({ qualification, className }) => {
  const entry = QUALIFICATIONS[qualification];

  console.log(entry);

  if (!entry) {
    return null;
  }

  const { name, abbreviation } = entry;

  return (
    <Badge className={clsx('qual-badge', `qual-badge-${abbreviation.toLowerCase()}`, className)}>
      <abbr title={name}>{abbreviation}</abbr>
    </Badge>
  );
};

export default QualificationBadge;
