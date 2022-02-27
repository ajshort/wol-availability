import React from 'react';

import ci from '../assets/chief-inspector.svg';
import jr from '../assets/job-ready.svg';
import lso from '../assets/leading-senior-operator.svg';
import o from '../assets/operator.svg';
import so from '../assets/senior-operator.svg';
import go from '../assets/group-officer.svg';
import sgo from '../assets/senior-group-officer.svg';
import ins from '../assets/inspector.svg';

const RankImage = ({ rank, ...props }) => {
  if (rank === 'None') {
    return null;
  }

  if (rank === 'SES Job Ready' || rank === 'Job Ready') {
    return <img src={jr} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Operator' || rank === 'Operator') {
    return <img src={o} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Senior Operator' || rank === 'Senior Operator') {
    return <img src={so} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Leading Senior Operator' || rank === 'Leading Senior Operator') {
    return <img src={lso} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Group Officer' || rank === 'Group Officer') {
    return <img src={go} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Senior Group Officer' || rank === 'Senior Group Officer') {
    return <img src={sgo} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Inspector' || rank === 'Inspector') {
    return <img src={ins} alt={rank} title={rank} {...props} />;
  }

  if (rank === 'SES Chief Inspector' || rank === 'Chief Inspector' || rank === 'SES Local Controller') {
    return <img src={ci} alt={rank} title={rank} {...props} />;
  }

  if (rank) {
    console.warn(`Missing rank image for ${rank}`);
  }

  return null;
};

export default RankImage;
