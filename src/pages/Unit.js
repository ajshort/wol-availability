import stringify from 'csv-stringify';
import gql from 'graphql-tag';
import moment from 'moment';
import React, { useState } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FaArrowLeft, FaArrowRight, FaTable } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { withRouter } from 'react-router-dom';

import MemberFilter from '../components/MemberFilter';
import Page from '../components/Page';
import UnitTable from '../components/UnitTable';
import { WEEK_START_DAY } from '../config';
import { ABBREVIATIONS, FEATURED, SUPPRESSED_BY } from '../qualifications';
import { FLEXIBLE_TEAMS, SUPPORT_TEAMS } from '../teams';
import { getMemberShiftAvailability, getWeekStart, getWeekEnd } from '../utils';

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
  const [hideBlankAndUnavailable, setHideBlankAndUnavailable] = useState(false);
  const [hideFlexibleAndSupport, setHideFlexibleAndSupport] = useState(true);

  // Check we actually have a valid start date.
  if (from.day() !== WEEK_START_DAY) {
    return <Alert variant='danger' className='m-3'>Invalid week start.</Alert>;
  }

  // Week links.
  const prevWeek = `/unit/storm/${from.clone().subtract(1, 'week').format('YYYY-MM-DD')}`;
  const nextWeek = `/unit/storm/${from.clone().add(1, 'week').format('YYYY-MM-DD')}`;

  // Query vars.
  const to = getWeekEnd(from);

  const variables = {
    from: from.format('YYYY-MM-DD'),
    to: to.format('YYYY-MM-DD'),
  };

  return (
    <Page title='Storm and Support' shortTitle='Storm'>
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
            .filter(member => {
              const some = member.shifts.some(({ shifts }) => shifts.some(
                ({ enabled, available }) => enabled && available === true
              ));

              if (some) {
                return true;
              }

              if (hideFlexibleAndSupport) {
                const flexible = FLEXIBLE_TEAMS.includes(member.team) || SUPPORT_TEAMS.includes(member.team);
                const filteredTo = team === member.team;

                if (flexible && !filteredTo) {
                  return false;
                }
              }

              return !hideBlankAndUnavailable;
            })
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

          const handleExport = () => {
            const shifts = getMemberShiftAvailability(from, []);

            const data = [
              [
                'Name',
                'Team',
                'Qualifications',
                ...shifts
                  .map(day => day.shifts.map(shift => ({ date: day.date, ...shift })))
                  .flat()
                  .filter(shift => shift.enabled)
                  .map(shift => shift.date.format('ddd D/M') + ' ' + shift.shift.toLowerCase())
              ],
              ...members.map(member => {
                return [
                  member.fullName,
                  member.team,
                  FEATURED
                    .filter(qual => member.qualifications.includes(qual))
                    .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
                    .map(qual => ABBREVIATIONS[qual])
                    .join(' '),
                  ...member.shifts
                    .map(day => day.shifts)
                    .flat()
                    .filter(shift => shift.enabled)
                    .map(({ available }) => {
                      if (available === true) {
                        return '1';
                      } else if (available === false) {
                        return '0';
                      } else {
                        return '';
                      }
                    }),
                ];

              })
            ];

            stringify(data, (err, records) => {
              const blob = new Blob([records], { type: 'text/csv;charset=UTF-8' });
              const url = window.URL.createObjectURL(blob);

              const a = document.createElement('a');
              a.style = 'display: none';
              a.href = url;
              a.download = 'availability.csv'
              a.click();

              window.URL.revokeObjectURL(url);
            });
          };

          return (
            <React.Fragment>
              <div className='m-3 d-flex align-items-center justify-content-between'>
                <LinkContainer to={prevWeek}>
                  <Button variant='link'>
                    <FaArrowLeft /><span className='d-none d-md-inline'>Previous week</span>
                  </Button>
                </LinkContainer>
                <div>
                  <MemberFilter
                    teams={teams}
                    team={team}
                    onTeamChanged={setTeam}
                    qualifications={qualifications}
                    onQualificationsChanged={setQualifications}
                    hideBlankAndUnavailable={hideBlankAndUnavailable}
                    onHideBlankAndUnavailableChanged={setHideBlankAndUnavailable}
                    hideFlexibleAndSupport={hideFlexibleAndSupport}
                    onHideFlexibleAndSupportChanged={setHideFlexibleAndSupport}
                  />
                  <Button
                    variant='secondary'
                    className='d-none d-md-inline-block ml-2'
                    onClick={handleExport}
                  >
                    <FaTable /> Export
                  </Button>
                </div>
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
    </Page>
  );
});

export default Unit;
