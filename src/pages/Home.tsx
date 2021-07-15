import { useAuth } from '../components/AuthContext';
import Page from '../components/Page';
import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import { anyRescueCapabilities } from '../config/units';
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
import _ from 'lodash';
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

interface MemberWithAvailability {
  member: MemberData & { mobile: string; };
  availability: { storm?: StormAvailable; rescue?: RescueAvailable; }
  membership: { code: string; team: string; }
}

interface QueryVars {
  unitCodes: string[];
}

interface QueryData {
  availableAt: MemberWithAvailability[];
}

const QUERY = gql`
  query($unitCodes: [String!]!) {
    availableAt(unitCodes: $unitCodes) {
      member {
        number
        fullName
        lastName
        rank
        qualifications
        mobile
      }

      availability {
        storm
        rescue
      }

      membership {
        code
        team
      }
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

interface StormCardProps {
  data: MemberWithAvailability[];
}

const StormCard: React.FC<StormCardProps> = ({ data }) => {
  const { config } = useAuth();

  const members = data
    .filter(({ membership }) => config.stormUnits.includes(membership.code))
    .sort(({ member: a }, { member: b }) => a.lastName.localeCompare(b.lastName));

  return (
    <Card className='mb-3'>
      <Card.Header className='d-flex justify-content-between align-items-center'>
        <span>Storm and Support <Badge variant='info'>{members.length}</Badge></span>
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
          {members.map(({ member, membership }) => (
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
                  {membership.team && <TeamBadge team={membership.team} />}
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
  data: MemberWithAvailability;
}

const FEATURED_RESCUE = [VERTICAL_RESCUE, ...FLOOD_RESCUE];

const RescueCardListItem: React.FC<RescueCardListItemProps> = ({ data: { member, availability } }) => (
  <ListGroup.Item>
    <div className='d-flex align-items-center justify-content-between'>
      <div>
        {availability.rescue === 'IMMEDIATE' && <FaCircle className='text-success mr-2' />}
        {availability.rescue === 'SUPPORT' && <FaCircle className='text-warning mr-2' />}
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
  data: MemberWithAvailability[];
}

const RescueCard: React.FC<RescueCardProps> = ({ data }) => {
  const [key, setKey] = useState('vr');

  // Create ordered list of VR and VR operators.
  const compareRescue = (a?: RescueAvailable, b?: RescueAvailable) => {
    if (a === 'IMMEDIATE' && b !== 'IMMEDIATE') {
      return -1;
    }
    if (b === 'IMMEDIATE' && a !== 'IMMEDIATE') {
      return 1;
    }
    return 0;
  };

  const vertical = data
    .filter(({ member: { qualifications } }) => qualifications.includes(VERTICAL_RESCUE))
    .sort((a, b) => (
      compareRescue(a.availability.rescue, b.availability.rescue) ||
      (a.membership.team || '').localeCompare(b.membership.team || '') ||
      a.member.lastName.localeCompare(b.member.lastName)
    ));

  const flood = data
    .filter(({ member: { qualifications } }) => qualifications.some(
      qual => FLOOD_RESCUE.indexOf(qual) !== -1
    ))
    .sort((a, b) => (
      compareRescue(a.availability.rescue, b.availability.rescue) ||
      compareFloodRescue(a.member.qualifications, b.member.qualifications) ||
      a.member.lastName.localeCompare(b.member.lastName)
    ));

  const vr = { immediate: 0, support: 0 };
  const fr = { l1: 0, l2: 0, l3: 0 };

  // Create totals for the badges up the top.
  for (const { member: { qualifications }, availability: { rescue } } of data) {
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
              <RescueCardListItem key={availability.member.number} data={availability} />
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
              <RescueCardListItem key={availability.member.number} data={availability} />
            ))
          ) : (
            <Card.Body>There are no members available.</Card.Body>
          )}
        </ListGroup>
      )}
    </Card>
  );
}

const DO_QUERY = gql`
  query($unit: String!) {
    dutyOfficersAt(unitCode: $unit) {
      shift
      member {
        fullName
        mobile
      }
    }
  }
`;

interface DutyOfficersData {
  shift: string;
  member: { fullName: string; mobile: string; };
}

interface DoQueryData {
  dutyOfficersAt: DutyOfficersData[];
}

interface DoQueryVars {
  unit: string;
}

const DutyOfficersAlert: React.FC<{ unit: string }> = ({ unit }) => (
  <Alert variant='info' className='mb-3'>
    <Query<DoQueryData, DoQueryVars> query={DO_QUERY} variables={{ unit }}>
      {({ loading, error, data }) => {
        if (loading) {
          return <><Spinner size='sm' animation='border' /> Loading duty officer&hellip;</>;
        }

        if (error || !data) {
          return <>Error loading duty officer</>;
        }

        const shift = getShift();
        const duty = data.dutyOfficersAt.find(x => x.shift === shift)?.member;

        return (
          <>
            Duty officer is <strong>{duty ? duty.fullName : 'unknown'}</strong>
            {duty && (<a className='ml-1' href={`tel:${duty.mobile}`}>
              <small>
                <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(duty.mobile)}</span>
              </small>
            </a>)}
          </>
        );

      }}
    </Query>
  </Alert>
);

const Home: React.FC = () => {
  const { config, unit } = useAuth();
  const unitCodes = _.uniq(_.concat(config.stormUnits, config.rescueUnits));
  const rescue = anyRescueCapabilities(config);

  return (
    <Page>
      <Container fluid className='my-3'>
        <Query<QueryData, QueryVars> query={QUERY} variables={{ unitCodes }}>
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
                {config.dutyOfficers && (
                  <DutyOfficersAlert unit={unit!.code} />
                )}
                <Row>
                  <Col md={rescue ? 6 : 12}>
                    <StormCard
                      data={data.availableAt.filter(({ availability }) => availability.storm === 'AVAILABLE')}
                    />
                  </Col>
                  {rescue && (
                    <Col md={6}>
                      <RescueCard
                        data={data.availableAt.filter(({ availability }) => (
                          availability.rescue === 'IMMEDIATE' || availability.rescue === 'SUPPORT'
                        ))}
                      />
                    </Col>
                  )}
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
