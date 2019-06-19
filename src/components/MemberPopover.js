import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Spinner from 'react-bootstrap/Spinner';
import { FaMobileAlt } from 'react-icons/fa';

import { formatMobile } from '../utils';

const MEMBER_QUERY = gql`
  query ($number: Int!) {
    member(number: $number) {
      mobile
      qualifications
      rank
      position
      team
    }
  }
`;

export default ({ children, name, number }) => {
  const popover = (
    <Popover title={name}>
      <Query query={MEMBER_QUERY} variables={{ number }}>
        {({ loading, error, data }) => {
          if (loading) {
            return <Spinner animation='border' size='sm' />;
          }

          if (error) {
            return <span className='text-danger'>Error loading member details</span>;
          }

          const { member } = data;

          return (
            <React.Fragment>
              <a href={`tel:${member.mobile}`}>
                <FaMobileAlt /> {formatMobile(member.mobile)}
              </a>
              <ul>
                {member.qualifications.sort().map(qual => (
                  <li key={qual}>{qual}</li>
                ))}
              </ul>
            </React.Fragment>
          );
        }}
      </Query>
    </Popover>
  );

  return (
    <OverlayTrigger trigger='click' placement='right' overlay={popover}>
      {children}
    </OverlayTrigger>
  );
}
