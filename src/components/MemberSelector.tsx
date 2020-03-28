import gql from 'graphql-tag';
import React from 'react';
import { Query } from 'react-apollo';
import { Typeahead } from 'react-bootstrap-typeahead';

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
        let placeholder: string;
        let disabled = false;
        let members: Array<{ id: number, label: string }> = [];

        if (loading) {
          placeholder = 'Loading members...';
          disabled = true;
        } else if (error || !data) {
          placeholder = 'Error loading members';
          disabled = true;
        } else {
          placeholder = 'Select member...'

          members = data.members
            .sort((a, b) => a.surname.localeCompare(b.surname))
            .map((member) => ({ id: member.number, label: member.fullName }));
        }

        return (
          <Typeahead
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            options={members}
            onChange={(selected) => onChange(selected.length === 0 ? undefined : selected[0].id)}
          />
        );
      }}
    </Query>
  );
};

export default MemberSelector;
