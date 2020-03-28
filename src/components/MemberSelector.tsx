import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import { Typeahead } from 'react-bootstrap-typeahead';
import Spinner from 'react-bootstrap/Spinner';

const GET_MEMBERS_QUERY = gql`
  {
    members {
      _id
      fullName
      number
      surname
      team
    }
  }
`;

interface MemberData {
  _id: string;
  fullName: string;
  number: number;
  surname: string;
}

interface GetMembersData {
  members: MemberData[];
}

interface MemberSelectorProps {
  id: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ id, value, onChange }) => {
  return (
    <Query<GetMembersData> query={GET_MEMBERS_QUERY}>
      {({ loading, error, data }) => {
        if (loading) {
          return (
            <p>
              <Spinner as='span' animation='border' size='sm' /> Loading members&hellip;
            </p>
          );
        }

        if (error || !data) {
          return <p className='text-danger'>Error loading members</p>;
        }

        const members = data.members
          .sort((a, b) => a.surname.localeCompare(b.surname))
          .map((member) => ({ id: member.number, label: member.fullName }));

        return (
          <Typeahead
            id={id}
            options={members}
            onChange={(selected) => onChange(selected.length === 0 ? undefined : selected[0].id)}
          />
        );
      }}
    </Query>
  );
};

export default MemberSelector;
