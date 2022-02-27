import logo from '../assets/logo.svg';
import { anyRescueCapabilities } from '../config/units';
import { AuthConsumer, useAuth } from './AuthContext';

import React, { useEffect } from 'react';
import Div100vh from 'react-div-100vh';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { FaUser } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { NavLinkProps, useRouteMatch } from 'react-router-dom';

export interface PageProps {
  title?: string;
  shortTitle?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ children, ...props }) => (
  <LinkContainer {...props}>
    <Nav.Link>{children}</Nav.Link>
  </LinkContainer>
);

interface UnitNavDropdownProps {
  rescue?: boolean;
}

const UnitNavDropdown: React.FC<UnitNavDropdownProps> = ({ rescue }) => {
  const { config } = useAuth();
  const active = useRouteMatch('/unit') !== null;

  return (
    <NavDropdown id='unit' title='Unit' className={active ? 'active' : null}>
      <LinkContainer to='/unit/storm'>
        <NavDropdown.Item>Storm and Support</NavDropdown.Item>
      </LinkContainer>
      {rescue && (
        <LinkContainer to='/unit/vr'>
          <NavDropdown.Item>Rescue</NavDropdown.Item>
        </LinkContainer>
      )}
      {config.dutyOfficers && (
        <LinkContainer to='/unit/do'>
          <NavDropdown.Item>Duty Officers</NavDropdown.Item>
        </LinkContainer>
      )}
    </NavDropdown>
  );
};

interface BrandProps {
  text?: string;
}

const Brand: React.FC<BrandProps> = ({ text }) => (
  <Navbar.Brand>
    <img src={logo} alt='SES Logo' width={20} height={20} /> {text || 'SES Availability' }
  </Navbar.Brand>
);

const Header: React.FC<PageProps> = ({ title, shortTitle }) => {
  const { config } = useAuth();
  const rescue = anyRescueCapabilities(config);

  return (
    <Navbar id='app-navbar' bg='dark' expand='md' variant='dark'>
      <AuthConsumer>
        {({ member, unit, setUnit }) => (member ? (
          <React.Fragment>
            <LinkContainer to='/' exact>
              <Brand text={shortTitle || title} />
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse timeout={0}>
              <Nav>
                <NavLink to='/' exact>Home</NavLink>
                <NavLink to='/member'>Member</NavLink>
                <UnitNavDropdown rescue={rescue} />
                <NavLink to='/stats'>Statistics</NavLink>
              </Nav>
              <Nav className='ml-auto'>
                <NavDropdown
                  id='nav-dropdown-user'
                  title={<><FaUser /> {member.preferredName || member.fullName} ({unit?.name})</>}
                >
                  {member.units.map(({ code, name }) => (
                    <NavDropdown.Item
                      key={code}
                      active={unit?.code === code}
                      onClick={() => setUnit(code)}
                    >
                      {name}
                    </NavDropdown.Item>
                  ))}
                  <NavDropdown.Divider />
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
    </Navbar>
  );
};

const Page: React.FC<PageProps> = ({ title, shortTitle, children }) => {
  useEffect(() => {
    document.title = title ? `${title} | SES Availability` : 'SES Availability';
  });

  return (
    <Div100vh id='container'>
      <Header title={title} shortTitle={shortTitle} />
      {children}
    </Div100vh>
  );
}

export default Page;
