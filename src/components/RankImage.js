import React from 'react';

import jr from '../assets/job-ready.svg';
import lso from '../assets/leading-senior-operator.svg';
import o from '../assets/operator.svg';
import so from '../assets/senior-operator.svg';
import sgo from '../assets/senior-group-officer.svg';
import ins from '../assets/inspector.svg';

export default ({ rank, ...props }) => {
  if (rank === 'SES Job Ready') {
    return <img src={jr} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Operator') {
    return <img src={o} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Senior Operator') {
    return <img src={so} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Leading Senior Operator') {
    return <img src={lso} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Senior Group Officer') {
    return <img src={sgo} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Inspector') {
    return <img src={ins} alt={rank} title={rank} {...props} />;
  }

  if (rank) {
    console.warn(`Missing rank image for ${rank}`);
  }

  return null;
}
