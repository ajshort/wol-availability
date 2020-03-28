import logo from '../assets/logo.svg';
import { AuthConsumer } from './AuthContext';

import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { FaUser } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLinkProps, useRouteMatch } from 'react-router-dom';

const NavLink: React.FC<NavLinkProps> = ({ children, ...props }) => (
  <LinkContainer {...props}>
    <Nav.Link>{children}</Nav.Link>
  </LinkContainer>
);

const UnitNavDropdown: React.FC = () => {
  const active = useRouteMatch('/unit') !== null;

  return (
    <NavDropdown id='unit' title='Unit' className={active ? 'active' : null}>
      <LinkContainer to='/unit/storm'>
        <NavDropdown.Item>Storm and Support</NavDropdown.Item>
      </LinkContainer>
      <LinkContainer to='/unit/do'>
        <NavDropdown.Item>Duty Officers</NavDropdown.Item>
      </LinkContainer>
    </NavDropdown>
  );
};

const Brand: React.FC = () => (
  <Navbar.Brand>
    <img src={logo} alt='SES Logo' width={20} height={20} /> WOL SES
  </Navbar.Brand>
);

const Header = () => (
  <Navbar id='app-navbar' bg='dark' expand='md' variant='dark'>
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
                <UnitNavDropdown />
                <NavLink to='/stats'>Statistics</NavLink>
              </Nav>
              <Nav className='ml-auto'>
                <NavDropdown
                  id='nav-dropdown-user'
                  title={<><FaUser /> {member ? (member as any).fullName : ''}</>}
                >
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
          <div className='mx-auto'>
            <Brand />
          </div>
        ))}
      </AuthConsumer>
    </Container>
  </Navbar>
);

export default Header;
