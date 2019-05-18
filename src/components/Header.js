import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

const Header = () => (
  <Navbar bg='dark' expand='md' variant='dark'>
    <Container>
      <Navbar.Brand>WOL SES</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Header;
