import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import { MemberData } from '../queries/members';
import TeamBadge from '../components/TeamBadge';
import { StormAvailable, RescueAvailable } from '../model/availability';
import { getShift } from '../model/dates';
import {
  compareFloodRescue,
  FEATURED,
  FLOOD_RESCUE,
  FLOOD_RESCUE_L1,
  FLOOD_RESCUE_L2,
  FLOOD_RESCUE_L3,
  SUPPRESSED_BY,
  VERTICAL_RESCUE,
} from '../model/qualifications';

import gql from 'graphql-tag';
import React, { useState } from 'react';
import { Query } from '@apollo/client/react/components';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { LinkContainer } from 'react-router-bootstrap';
import { FaCircle, FaMobileAlt } from 'react-icons/fa';

interface ShiftTeamsData {
  day: string;
  night: string;
}

interface DutyOfficersData {
  shift: string;
  member: { fullName: string; mobile: string; };
}

interface ExtendedMemberData extends MemberData {
  unit: string;
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
    shiftTeams(unit: "WOL") {
      day
      night
    }

    dutyOfficersAt {
      shift
      member {
        fullName
        mobile
      }
    }

    availableAt {
      member {
        number
        fullName
        lastName
        rank
        qualifications
        mobile
      }

      storm
      rescue
    }
  }
`;

function formatMobile(mobile?: string) {
  if (!mobile) {
    return '';
  }

  const nums = mobile.replace(/\s/g, '');

  if (!/[0-9]{10}/.test(nums)) {
    return mobile;
  }

  return [nums.substring(0, 4), nums.substring(4, 7), nums.substring(7, 10)].join(' ');
}

interface ShiftTeamsAlertProps {
  shiftTeams: ShiftTeamsData;
  dutyOfficers: DutyOfficersData[];
}

const ShiftTeamsAlert: React.FC<ShiftTeamsAlertProps> = ({ shiftTeams, dutyOfficers }) => (
  <Alert variant='info' className='mb-3'>
    {(() => {
      const { day, night } = shiftTeams;
      const shift = getShift();
      const duty = dutyOfficers.find(x => x.shift === shift)?.member;

      return (
        <>
          <p>
            Duty officer is <strong>{duty ? duty.fullName : 'unknown'}</strong>
            {duty && (<a className='ml-1' href={`tel:${duty.mobile}`}>
              <small>
                <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(duty.mobile)}</span>
              </small>
            </a>)}
          </p>
          <p className='mb-0'>
            Day shift is <strong>{day}</strong>, night shift is <strong>{night}</strong>.
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
  const auth = useAuth();

  members = members
    // .filter(member => member.unit === unit)
    .sort((a, b) => (
      a.lastName.localeCompare(b.lastName)
    ));

  return (
    <Card className='mb-3'>
      <Card.Header className='d-flex justify-content-between align-items-center'>
        <span>Storm <Badge variant='info'>{members.length}</Badge></span>
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
                  {/* <TeamBadge team={member.team} /> */}
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
};

interface RescueCardListItemProps {
  availability: AvailableData;
}

const FEATURED_RESCUE = [VERTICAL_RESCUE, ...FLOOD_RESCUE];

const RescueCardListItem: React.FC<RescueCardListItemProps> = ({ availability: { member, rescue } }) => (
  <ListGroup.Item>
    <div className='d-flex align-items-center justify-content-between'>
      <div>
        {rescue === 'IMMEDIATE' && <FaCircle className='text-success mr-2' />}
        {rescue === 'SUPPORT' && <FaCircle className='text-warning mr-2' />}
        {member.fullName}
        <a className='ml-1' href={`tel:${member.mobile}`}>
          <small>
            <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(member.mobile)}</span>
          </small>
        </a>
      </div>
      <div className='text-right'>
        {
          FEATURED_RESCUE
            .filter(qual => member.qualifications.includes(qual))
            .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
            .map(qual => <QualificationBadge key={qual} qualification={qual} className='ml-1' />)
        }
      </div>
    </div>
  </ListGroup.Item>
);

interface RescueCardProps {
  availabilties: AvailableData[];
}

const RescueCard: React.FC<RescueCardProps> = ({ availabilties }) => {
  const [key, setKey] = useState('vr');

  // Create ordered list of VR and VR operators.
  const compareRescue = ({ rescue: a }: AvailableData, { rescue: b }: AvailableData) => {
    if (a === 'IMMEDIATE' && b !== 'IMMEDIATE') {
      return -1;
    }
    if (b === 'IMMEDIATE' && a !== 'IMMEDIATE') {
      return 1;
    }
    return 0;
  };

  const vertical = availabilties
    .filter(({ member: { qualifications } }) => qualifications.includes(VERTICAL_RESCUE))
    .sort((a, b) => (
      compareRescue(a, b) ||
      // a.member.team.localeCompare(b.member.team) ||
      a.member.lastName.localeCompare(b.member.lastName)
    ));

  const flood = availabilties
    .filter(({ member: { qualifications } }) => qualifications.some(
      qual => FLOOD_RESCUE.indexOf(qual) !== -1
    ))
    .sort((a, b) => (
      compareRescue(a, b) ||
      compareFloodRescue(a.member.qualifications, b.member.qualifications) ||
      a.member.lastName.localeCompare(b.member.lastName)
    ));

  const vr = { immediate: 0, support: 0 };
  const fr = { l1: 0, l2: 0, l3: 0 };

  // Create totals for the badges up the top.
  for (const { member: { qualifications }, rescue } of availabilties) {
    if (qualifications.includes(VERTICAL_RESCUE)) {
      if (rescue === 'IMMEDIATE') {
        vr.immediate++;
      } else if (rescue === 'SUPPORT') {
        vr.support++;
      }
    }

    if (rescue !== 'IMMEDIATE') {
      continue;
    }

    let counted = false;

    if (qualifications.includes(FLOOD_RESCUE_L3)) {
      fr.l3++;
      counted = true;
    }
    if (qualifications.includes(FLOOD_RESCUE_L2)) {
      fr.l2++;
      counted = true;
    }
    if (!counted && qualifications.includes(FLOOD_RESCUE_L1)) {
      fr.l1++;
    }
  }

  return (
    <Card className='mb-3'>
      <Card.Header>
        <Nav variant='tabs' activeKey={key} onSelect={setKey}>
          <Nav.Item>
            <Nav.Link eventKey='vr'>
              <span className='d-none d-lg-inline'>Vertical Rescue</span>{' '}
              <span className='d-lg-none'>VR</span>{' '}
              <Badge variant='success'>{vr.immediate}</Badge>{' '}
              <Badge variant='warning'>{vr.support}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="fr">
              <span className='d-none d-lg-inline'>Flood Rescue</span>{' '}
              <span className='d-lg-none'>FR</span>{' '}
              <Badge className='qual-badge-iw'>{fr.l3}</Badge>{' '}
              <Badge className='qual-badge-ow'>{fr.l2}</Badge>{' '}
              <Badge className='qual-badge-lb'>{fr.l1}</Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Header>
      {key === 'vr' && (
        <ListGroup variant='flush'>
          {vertical.length > 0 ? (
            vertical.map(availability => (
              <RescueCardListItem key={availability.member.number} availability={availability} />
            ))
          ) : (
            <Card.Body>There are no members available.</Card.Body>
          )}
        </ListGroup>
      )}
      {key === 'fr' && (
        <ListGroup variant='flush'>
          {flood.length > 0 ? (
            flood.map(availability => (
              <RescueCardListItem key={availability.member.number} availability={availability} />
            ))
          ) : (
            <Card.Body>There are no members available.</Card.Body>
          )}
        </ListGroup>
      )}
    </Card>
  );
}

const Home: React.FC = () => {
  return (
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
                {/* <ShiftTeamsAlert shiftTeams={data.shiftTeams} dutyOfficers={data.dutyOfficersAt} /> */}
                <Row>
                  <Col md={6}>
                    <StormCard
                      members={data.availableAt.filter(({ storm }) => storm === 'AVAILABLE').map(val => val.member)}
                    />
                  </Col>
                  <Col md={6}>
                    <RescueCard availabilties={data.availableAt.filter(({ rescue }) => (
                      rescue === 'IMMEDIATE' || rescue === 'SUPPORT'
                    ))} />
                  </Col>
                </Row>
              </React.Fragment>
            );
          }}
        </Query>
      </Container>
    </Page>
  );
}

export default Home;
