import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { FaUser } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';

import logo from '../assets/logo.svg';
import { AuthConsumer } from '../components/AuthContext';

const NavLink = ({ children, to, ...props }) => (
  <LinkContainer to={to} {...props}>
    <Nav.Link>{children}</Nav.Link>
  </LinkContainer>
);

const Brand = (props) => (
  <Navbar.Brand {...props}>
    <img src={logo} alt='SES Logo' width={20} height={20} /> WOL SES
  </Navbar.Brand>
);

const Header = () => (
  <Navbar bg='dark' className='Header' expand='md' variant='dark'>
    <Container>
      <AuthConsumer>
        {({ member }) => (member ? (
          <React.Fragment>
            <LinkContainer to='/' exact>
              <Brand />
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse>
              <Nav>
                <NavLink to='/' exact>Home</NavLink>
                <NavLink to='/member'>Member</NavLink>
                <NavLink to='/unit'>Unit</NavLink>
                <NavLink to='/stats'>Statistics</NavLink>
              </Nav>
              <Nav className='ml-auto'>
                <NavDropdown title={<><FaUser /> {member.fullName}</>}>
                  <LinkContainer to='/member/me'>
                    <NavDropdown.Item>My availability</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to='/logout'>
                    <NavDropdown.Item>Logout</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </React.Fragment>
        ) : (
          <Brand className='mx-auto' />
        ))}
      </AuthConsumer>
    </Container>
  </Navbar>
);

export default Header;
