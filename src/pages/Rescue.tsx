import Page from '../components/Page';

import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';

interface RescueProps {
  title: string;
}

const Rescue: React.FC<RescueProps> = ({ title }) => {
  return (
    <Page title={title}>
      <Nav variant='tabs' className='mt-1'>
        <Nav.Item>
          <LinkContainer to='/unit/vr'><Nav.Link>Vertical Rescue</Nav.Link></LinkContainer>
        </Nav.Item>
        <Nav.Item>
        <LinkContainer to='/unit/fr'><Nav.Link>Flood Rescue</Nav.Link></LinkContainer>
        </Nav.Item>
      </Nav>
    </Page>
  );
};

export const FloodRescue: React.FC = () => (
  <Rescue title='Flood Rescue' />
);

export const VerticalRescue: React.FC = () => (
  <Rescue title='Vertical Rescue' />
);
