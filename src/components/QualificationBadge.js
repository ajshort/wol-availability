import classnames from 'classnames';
import React from 'react';
import Badge from 'react-bootstrap/Badge';

import { ABBREVIATIONS } from '../model/qualifications';

const QualificationBadge = ({ qualification, className }) => {
  const classes = ['qual-badge', className];

  let text;

  if (qualification in ABBREVIATIONS) {
    text = ABBREVIATIONS[qualification];
    classes.push(`qual-badge-${text.toLowerCase()}`);
  } else {
    text = qualification;
  }

  return (
    <Badge className={classnames(classes)}>
      <abbr title={qualification}>{text}</abbr>
    </Badge>
  );
};

export default QualificationBadge;
