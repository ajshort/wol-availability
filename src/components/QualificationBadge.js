import React from 'react';
import Badge from 'react-bootstrap/Badge';

import { getQualificationAbbreviation, getQualificationName } from '../utils';

const QualificationBadge = ({ qualification, ...props }) => {
  const classes = ['qual-badge', `qual-badge-${qualification.toLowerCase()}`];

  const title = getQualificationName(qualification);
  const abbr = getQualificationAbbreviation(qualification);

  return (
    <Badge className={classes.join(' ')}>
      <abbr title={title}>{abbr}</abbr>
    </Badge>
  );
};

export default QualificationBadge;
