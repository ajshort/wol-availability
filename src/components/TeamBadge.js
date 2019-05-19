import React from 'react';
import Badge from 'react-bootstrap/Badge';

const TeamBadge = ({ team, ...props }) => {
  const classes = ['team-badge', `team-badge-${team.toLowerCase()}`];

  return (
    <Badge className={classes.join(' ')}>{team}</Badge>
  );
};

export default TeamBadge;
