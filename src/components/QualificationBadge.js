import classnames from 'classnames';
import React from 'react';
import Badge from 'react-bootstrap/Badge';

import { getQualificationAbbreviation, getQualificationName } from '../utils';

const QualificationBadge = ({ qualification, className, ...props }) => {
  const title = getQualificationName(qualification);
  const abbr = getQualificationAbbreviation(qualification);

  const cls = abbr.toLowerCase();
  const classes = classnames('qual-badge', `qual-badge-${cls}`, className);

  return (
    <Badge className={classes}>
      <abbr title={title}>{abbr}</abbr>
    </Badge>
  );
};

export default QualificationBadge;
