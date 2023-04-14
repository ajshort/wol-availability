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
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { Query } from '@apollo/client/react/components';
import _ from 'lodash';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import DatePicker from 'react-datepicker';
import { LinkContainer } from 'react-router-bootstrap';
import { FaCircle, FaClock, FaMobileAlt } from 'react-icons/fa';

interface MemberWithAvailability {
  member: MemberData & { mobile: string; };
  availability: { storm?: StormAvailable; rescue?: RescueAvailable; end: string; note?: string; vehicle?: string; }
  membership: { code: string; team: string; }
}

interface QueryVars {
  primaryUnitCode: string;
  unitCodes: string[];
  instant?: Date;
}

interface DutyOfficersData {
  shift: string;
  member: { fullName: string; mobile: string; };
}

interface ShiftTeamsData {
  day?: string;
  night?: string;
}

interface QueryData {
  availableAt: MemberWithAvailability[];
  dutyOfficersAt: DutyOfficersData[];
  shiftTeams?: ShiftTeamsData;
}

const QUERY = gql`
  query($primaryUnitCode: String!, $unitCodes: [String!]!, $instant: DateTime) {
    availableAt(unitCodes: $unitCodes, instant: $instant) {
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
        end
        vehicle
        note
      }

      membership {
        code
        team
      }
    }

    dutyOfficersAt(unitCode: $primaryUnitCode) {
      shift
      member {
        fullName
        mobile
      }
    }

    shiftTeams(unitCode: $primaryUnitCode) {
      day
      night
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

interface StormMemberItemProps {
  instant: DateTime;
  data: MemberWithAvailability;
}

const StormMemberItem: React.FC<StormMemberItemProps> = ({ instant, data: { member, membership, availability } }) => (
  <ListGroup.Item>
    <div className='d-flex align-items-center justify-content-between'>
      <div>
        {member.fullName}
        <a className='ml-1' href={`tel:${member.mobile}`}>
          <small>
            <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(member.mobile)}</span>
          </small>
        </a>
        <small className='d-block d-md-inline'>
          {DateTime.fromISO(availability.end).hasSame(instant, 'day') ? (
            ` until ${DateTime.fromISO(availability.end).toLocaleString(DateTime.TIME_24_SIMPLE)}`
          ) : (
            ' all day'
          )}
          {availability.note && ` (${availability.note})`}
        </small>
      </div>
      <div className='text-right'>
        <RankImage rank={member.rank} className='mr-1' width={8} height={16} />
        {membership.team && <TeamBadge team={membership.team} />}
        {
          FEATURED
            .filter(qual => member.qualifications.includes(qual))
            .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
            .map(qual => <QualificationBadge key={qual} qualification={qual} member={member} className='ml-1' />)
        }
      </div>
    </div>
  </ListGroup.Item>
);

interface StormCardProps {
  instant: DateTime;
  data: MemberWithAvailability[];
}

const StormCard: React.FC<StormCardProps> = ({ instant, data }) => {
  const { config } = useAuth();

  const members = data
    .filter(({ membership }) => config.stormUnits.includes(membership.code))
    .sort(({ member: a }, { member: b }) => a.lastName.localeCompare(b.lastName));

  const items = config.operationsTeams ? (
    <>
      <ListGroup.Item className='list-group-subheading'>Field</ListGroup.Item>
      {members.filter(data => !config.operationsTeams?.includes(data.membership.team)).map(data => (
        <StormMemberItem key={data.member.number} instant={instant} data={data} />
      ))}
      <ListGroup.Item className='list-group-subheading'>Operations</ListGroup.Item>
      {members.filter(data => config.operationsTeams?.includes(data.membership.team)).map(data => (
        <StormMemberItem key={data.member.number} instant={instant} data={data} />
      ))}
    </>
  ) : (
    members.map(data => (
      <StormMemberItem key={data.member.number} instant={instant} data={data} />
    ))
  );

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
          {items}
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
      {availability.vehicle && <Badge className='ml-1'>{availability.vehicle}</Badge>}
        {
          FEATURED_RESCUE
            .filter(qual => member.qualifications.includes(qual))
            .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
            .map(qual => <QualificationBadge key={qual} qualification={qual} member={member} className='ml-1' />)
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
  const { config } = useAuth();

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
          {config.capabilities.verticalRescue && (
            <Nav.Item>
              <Nav.Link eventKey='vr'>
                <span className='d-none d-lg-inline'>Vertical Rescue</span>{' '}
                <span className='d-lg-none'>VR</span>{' '}
                <Badge variant='success'>{vr.immediate}</Badge>{' '}
                <Badge variant='warning'>{vr.support}</Badge>
              </Nav.Link>
            </Nav.Item>
          )}
          {config.capabilities.floodRescue && (
            <Nav.Item>
              <Nav.Link eventKey="fr">
                <span className='d-none d-lg-inline'>Flood Rescue</span>{' '}
                <span className='d-lg-none'>FR</span>{' '}
                <Badge className='qual-badge-iw'>{fr.l3}</Badge>{' '}
                <Badge className='qual-badge-ow'>{fr.l2}</Badge>{' '}
                <Badge className='qual-badge-lb'>{fr.l1}</Badge>
              </Nav.Link>
            </Nav.Item>
          )}
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

interface DutyOfficersAlertProps {
  dutyOfficers: DutyOfficersData[];
  shiftTeams?: ShiftTeamsData;
}

const DutyOfficersAlert: React.FC<DutyOfficersAlertProps> = ({ dutyOfficers, shiftTeams }) => (
  <Alert variant='info' className='mb-3'>
    {(() => {
      const shift = getShift();
      const duty = dutyOfficers.find(x => x.shift === shift)?.member;

      return (
        <>
          <p className='mb-0'>
            Duty officer is <strong>{duty ? duty.fullName : 'unknown'}</strong>
            {duty && (<a className='ml-1' href={`tel:${duty.mobile}`}>
              <small>
                <FaMobileAlt /> <span className='d-none d-md-inline'>{formatMobile(duty.mobile)}</span>
              </small>
            </a>)}
          </p>
          {shiftTeams && (
            <p className='mt-2 mb-0'>
              Day shift is <strong>{shiftTeams.day}</strong> and night shift is <strong>{shiftTeams.night}</strong>
            </p>
          )}
        </>
      );
    })()}
  </Alert>
);

interface PickInstantModalProps {
  initialValue?: Date | null;
  onChange: (date: Date | null) => void;
  onHide: () => void;
}

const PickInstantModal: React.FC<PickInstantModalProps> = ({ initialValue, onChange, onHide }) => {
  const [value, setValue] = useState<Date | null>(initialValue || null);

  const handleClick = () => {
    onChange(value);
    onHide();
  };

  return (
    <Modal show={true} onHide={onHide}>
      <Modal.Body>
        <DatePicker
          selected={value}
          onChange={setValue}
          showTimeSelect={true}
          className='form-control'
          dateFormat='MMMM d, yyyy h:mm aa'
        />
      </Modal.Body>
      <Modal.Footer>
        <Button type='submit' variant='primary' onClick={handleClick}>OK</Button>
        <Button type='submit' variant='secondary' onClick={onHide}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}

const Home: React.FC = () => {
  const { config, unit } = useAuth();
  const unitCodes = _.uniq(_.concat(config.stormUnits, config.rescueUnits));
  const rescue = anyRescueCapabilities(config);

  const [choosingInstant, setChoosingInstant] = useState(false);
  const [instant, setInstant] = useState<DateTime | null>(null);

  return (
    <Page>
      {choosingInstant && (
        <PickInstantModal
          initialValue={instant ? instant.toJSDate() : new Date()}
          onChange={date => setInstant(date ? DateTime.fromJSDate(date) : null)}
          onHide={() => setChoosingInstant(false)}
        />
      )}
      <Container fluid className='my-3'>
        <Query<QueryData, QueryVars> query={QUERY} variables={{ primaryUnitCode: unit!.code, unitCodes, instant: instant?.toJSDate() }}>
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
                  <DutyOfficersAlert dutyOfficers={data.dutyOfficersAt} shiftTeams={data.shiftTeams} />
                )}
                <p>
                  Viewing members available <a href="#" onClick={e => { setChoosingInstant(true); e.preventDefault(); }}>{instant ? `at ${instant.toLocaleString(DateTime.DATETIME_MED)}` : 'now'} <FaClock /></a>
                </p>
                <Row>
                  <Col md={rescue ? 6 : 12}>
                    <StormCard
                      instant={instant || DateTime.local()}
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
