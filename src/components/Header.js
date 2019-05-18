import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { LinkContainer } from 'react-router-bootstrap';

import logo from '../assets/logo.svg';

const NavLink = ({ children, to, ...props }) => (
  <LinkContainer to={to} {...props}>
    <Nav.Link>{children}</Nav.Link>
  </LinkContainer>
);

const Header = () => (
  <Navbar bg='dark' className='Header' expand='md' variant='dark'>
    <Container>
      <LinkContainer to='/' exact>
        <Navbar.Brand>
          <img src={logo} alt='SES Logo' width={20} height={20} /> WOL SES
        </Navbar.Brand>
      </LinkContainer>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav>
          <NavLink to='/' exact>Home</NavLink>
          <NavLink to='/member'>Member</NavLink>
          <NavLink to='/unit'>Unit</NavLink>
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default Header;
