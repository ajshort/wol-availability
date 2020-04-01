import gql from 'graphql-tag';
import moment from 'moment';
import React, { useEffect } from 'react';
import { Query } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { LinkContainer } from 'react-router-bootstrap';
import { FaMobileAlt } from 'react-icons/fa';

import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import TeamBadge from '../components/TeamBadge';
import { FEATURED, SUPPRESSED_BY } from '../qualifications';
import { formatMobile, getDocumentTitle } from '../utils';

const SHIFT_TEAMS_QUERY = gql`
  {
    shiftTeams {
      day
      night
    }

    dutyOfficersAt {
      shift
      member {
        fullName
      }
    }
  }
`;

const ShiftTeamsAlert = () => (
  <Query query={SHIFT_TEAMS_QUERY}>
    {({ loading, error, data }) => (
      <Alert variant={error ? 'danger' : 'info'} className='mb-3'>
        {(() => {
          if (loading) {
            return (
              <><Spinner as='span' animation='border' size='sm' /> Loading shift teams&hellip;</>
            );
          }

          if (error || !data) {
            return 'Error loading shift teams';
          }

          const { day, night } = data.shiftTeams;

          const dayDO = data.dutyOfficersAt.find(val => val.shift === 'DAY')?.member;
          const nightDO = data.dutyOfficersAt.find(val => val.shift === 'NIGHT')?.member;

          return (
            <>
              <p>
                <span role="img" aria-label="Day">🌞</span>{' '}
                Day shift is <strong>{day}</strong>, duty officer <strong>{dayDO ? dayDO.fullName : 'unknown'}</strong>.
              </p>
              <p className='mb-0'>
                <span role="img" aria-label="Night">🌃</span>{' '}
                Night shift is <strong>{night}</strong>, duty officer <strong>{nightDO ? nightDO.fullName : 'unknown'}</strong>.
              </p>
            </>
          );
        })()}
      </Alert>
    )}
  </Query>
);

const AVAILABLE_MEMBERS_QUERY = gql`
  query ($instant: DateTime!) {
    membersAvailable(instant: $instant) {
      number
      fullName
      surname
      mobile
      team
      rank
      qualifications
    }
  }
`;

const MembersCard = () => (
  <Card>
    <Card.Header className='d-flex justify-content-between align-items-center'>
      Available Members
      <LinkContainer to='/member/me'>
        <Button variant='primary' size='sm'>
          My availability
        </Button>
      </LinkContainer>
    </Card.Header>
    <Query query={AVAILABLE_MEMBERS_QUERY} variables={{ instant: moment().format() }}>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <Card.Body>
              <Spinner animation='border' size='sm' /> Loading available members&hellip;
            </Card.Body>
          );
        }

        if (error) {
          return (
            <Card.Body className='text-danger'>Error loading available members.</Card.Body>
          );
        }

        const members = data.membersAvailable.sort((a, b) => (
          a.surname.localeCompare(b.surname)
        ));

        if (!members || members.length === 0) {
          return <Card.Body>There are no members available.</Card.Body>;
        }

        return (
          <ListGroup variant='flush'>
            {members.map((member) => (
              <ListGroup.Item key={member.number}>
                <div className='d-flex align-items-center justify-content-between'>
                  <div>
                    {member.fullName}
                    <a className='ml-1' href={`tel:${member.mobile}`}>
                      <small>
                        <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(member.mobile)}</span>
                      </small>
                    </a>
                  </div>
                  <div className='text-right'>
                    <RankImage rank={member.rank} className='mr-1' width={8} height={16} />
                    <TeamBadge team={member.team} />
                    {
                      FEATURED
                        .filter(qual => member.qualifications.includes(qual))
                        .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
                        .map(qual => <QualificationBadge key={qual} qualification={qual} className='ml-1' />)
                    }
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        );
      }}
    </Query>
  </Card>
);

const Home = () => {
  useEffect(() => {
    document.title = getDocumentTitle('Home');
  });

  return (
    <Container className='my-3'>
      <ShiftTeamsAlert />
      <Row>
        <Col lg className='mb-3'>
          <MembersCard />
        </Col>
      </Row>
    </Container>
  )
}

export default Home;
