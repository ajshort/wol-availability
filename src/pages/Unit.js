import gql from 'graphql-tag';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { withRouter } from 'react-router-dom';

import MemberFilter from '../components/MemberFilter';
import UnitTable from '../components/UnitTable';
import { WEEK_START_DAY } from '../config';
import { getDocumentTitle, getMemberShiftAvailability, getWeekStart, getWeekEnd } from '../utils';

const MEMBERS_QUERY = gql`
  query ($from: Date!, $to: Date!) {
    members {
      _id
      number
      fullName
      surname
      rank
      qualifications
      team
      availabilities(from: $from, to: $to) {
        date
        shift
        available
      }
    }
  }
`;

const Unit = withRouter(({ match }) => {
  let from;

  if (match.params.week !== undefined) {
    from = moment(match.params.week, 'YYYY-MM-DD');
  } else {
    from = getWeekStart();
  }

  const [qualifications, setQualifications] = useState([]);
  const [team, setTeam] = useState();
  const [hideBlank, setHideBlank] = useState(false);

  useEffect(() => {
    document.title = getDocumentTitle('Unit Availability');
  });

  // Check we actually have a valid start date.
  if (from.day() !== WEEK_START_DAY) {
    return <Alert variant='danger' className='m-3'>Invalid week start.</Alert>;
  }

  // Week links.
  const prevWeek = `/unit/${from.clone().subtract(1, 'week').format('YYYY-MM-DD')}`;
  const nextWeek = `/unit/${from.clone().add(1, 'week').format('YYYY-MM-DD')}`;

  // Query vars.
  const to = getWeekEnd(from);

  const variables = {
    from: from.format('YYYY-MM-DD'),
    to: to.format('YYYY-MM-DD'),
  };

  return (
    <Query query={MEMBERS_QUERY} variables={variables} fetchPolicy='network-only'>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <Alert variant='info' className='m-3'>
              <Spinner animation='border' size='sm' /> Loading members&hellip;
            </Alert>
          );
        }

        if (error) {
          return <Alert variant='danger' className='m-3'>Error loading members</Alert>;
        }

        const teams = [...new Set(data.members.map(member => member.team))].sort();

        const members = data.members
          .map(member => ({
            ...member, shifts: getMemberShiftAvailability(from, member.availabilities)
          }))
          .filter(member => !hideBlank || member.shifts.some(({ shifts }) => shifts.some(
            ({ enabled, available }) => enabled && available !== undefined
          )))
          .filter(member => !team || member.team === team)
          .filter(member => {
            for (const qual of qualifications) {
              if (!member.qualifications.includes(qual)) {
                return false;
              }
            }

            return true;
          })
          .sort((a, b) => a.team.localeCompare(b.team) || a.surname.localeCompare(b.surname))

        return (
          <React.Fragment>
            <div className='m-3 d-flex align-items-center justify-content-between'>
              <LinkContainer to={prevWeek}>
                <Button variant='link'>
                  <FaArrowLeft /><span className='d-none d-md-inline'>Previous week</span>
                </Button>
              </LinkContainer>
              <MemberFilter
                teams={teams}
                team={team}
                onTeamChanged={setTeam}
                qualifications={qualifications}
                onQualificationsChanged={setQualifications}
                hideBlank={hideBlank}
                onHideBlankChanged={setHideBlank}
              />
              <LinkContainer to={nextWeek}>
                <Button variant='link'>
                  <span className='d-none d-md-inline'>Next week</span><FaArrowRight />
                </Button>
              </LinkContainer>
            </div>
            <UnitTable members={members} from={from} to={to} />
          </React.Fragment>
        )
      }}
    </Query>
  );
});

export default Unit;
