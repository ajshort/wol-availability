import Page from '../components/Page';
import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import { MemberData } from '../queries/members';
import TeamBadge from '../components/TeamBadge';
import { StormAvailable, RescueAvailable } from '../model/availability';
import { FEATURED, SUPPRESSED_BY } from '../model/qualifications';
import { formatMobile } from '../utils';

import gql from 'graphql-tag';
import React from 'react';
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

interface ShiftTeamsData {
  day: string;
  night: string;
}

interface DutyOfficersData {
  shift: string;
  member: { fullName: string; };
}

interface ExtendedMemberData extends MemberData {
  mobile?: string;
}

interface AvailableData {
  member: ExtendedMemberData;
  storm?: StormAvailable;
  rescue?: RescueAvailable;
  vehicle?: string
}

interface QueryData {
  shiftTeams: ShiftTeamsData;
  dutyOfficersAt: DutyOfficersData[];
  availableAt: AvailableData[];
}

const QUERY = gql`
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

    availableAt {
      member {
        number
        fullName
        surname
        rank
        qualifications
        team
        mobile
      }

      storm
      rescue
    }
  }
`;

interface ShiftTeamsAlertProps {
  shiftTeams: ShiftTeamsData;
  dutyOfficers: DutyOfficersData[];
}

const ShiftTeamsAlert: React.FC<ShiftTeamsAlertProps> = ({ shiftTeams, dutyOfficers }) => (
  <Alert variant='info' className='mb-3'>
    {(() => {
      const { day, night } = shiftTeams;

      const dayDO = dutyOfficers.find(v => v.shift === 'DAY')?.member;
      const nightDO = dutyOfficers.find(v => v.shift === 'NIGHT')?.member;

      return (
        <>
          <p>
            <span role='img' aria-label='Day'>🌞</span>{' '}
            Day shift is <strong>{day}</strong>, duty officer <strong>{dayDO ? dayDO.fullName : 'unknown'}</strong>.
          </p>
          <p className='mb-0'>
            <span role='img' aria-label='Night'>🌃</span>{' '}
            Night shift is <strong>{night}</strong>, duty officer <strong>{nightDO ? nightDO.fullName : 'unknown'}</strong>.
          </p>
        </>
      );
    })()}
  </Alert>
);

interface StormCardProps {
  members: ExtendedMemberData[];
}

const StormCard: React.FC<StormCardProps> = ({ members }) => {
  members.sort((a, b) => (
    a.surname.localeCompare(b.surname)
  ));

  return (
    <Card>
      <Card.Header className='d-flex justify-content-between align-items-center'>
        Available Members
        <LinkContainer to='/member/me'>
          <Button variant='primary' size='sm'>
            My availability
          </Button>
        </LinkContainer>
      </Card.Header>
      {members.length === 0 ? (
        <Card.Body>There are no members available.</Card.Body>
      ) : (
        <ListGroup variant='flush'>
          {members.map(member => (
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
      )}
    </Card>
  );
}

const Home: React.FC = () => (
  <Page>
    <Container fluid className='my-3'>
      <Query<QueryData> query={QUERY}>
        {({ loading, error, data }) => {
          if (loading) {
            return (
              <Alert variant='info'>
                <Spinner size='sm' animation='border' /> Loading currently available members&hellip;
              </Alert>
            );
          }

          if (error || !data) {
            return <Alert variant='danger'>Error loading currently available members.</Alert>;
          }

          return (
            <React.Fragment>
              <ShiftTeamsAlert shiftTeams={data.shiftTeams} dutyOfficers={data.dutyOfficersAt} />
              <Row>
                <Col md={6}>
                  <StormCard
                    members={data.availableAt.filter(({ storm }) => storm === 'AVAILABLE').map(val => val.member)}
                  />
                </Col>
              </Row>
            </React.Fragment>
          );
        }}
      </Query>
    </Container>
  </Page>
);

export default Home;
