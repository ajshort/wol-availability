import Page from '../components/Page';
import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import TeamBadge from '../components/TeamBadge';
import WeekBrowser from '../components/WeekBrowser';
import { getWeekInterval, TIME_ZONE } from '../model/dates';
import { FEATURED, SUPPRESSED_BY } from '../model/qualifications';
import {
  GET_MEMBERS_AVAILABILITIES_QUERY,
  GetMembersAvailabilitiesData,
  GetMembersAvailabilitiesVars,
  MemberWithAvailabilityData,
} from '../queries/availability';

import { DateTime, Interval } from 'luxon';
import React, { useState } from 'react';
import { useQuery } from 'react-apollo';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { useHistory, useParams } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface UnitTableRowProps extends ListChildComponentProps {
  data: MemberWithAvailabilityData[];
}

const UnitTableRow: React.FC<UnitTableRowProps> = ({ data, index, style }) => {
  const member = data[index];

  return (
    <div className='unit-table-row' style={style}>
      <div className='unit-table-cell unit-table-name'>
        {member.fullName} <RankImage rank={member.rank} width={8} height={16} />
      </div>
      <div className='unit-table-cell unit-table-team'>
        <TeamBadge team={member.team} />
      </div>
      <div className='unit-table-cell unit-table-quals'>
        {
          FEATURED
            .filter(qual => member.qualifications.includes(qual))
            .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
            .map(qual => <QualificationBadge key={qual} qualification={qual} className='mr-1' />)
        }
      </div>
    </div>
  );
}

interface UnitTableProps {
  members: MemberWithAvailabilityData[];
}

const UnitTable: React.FC<UnitTableProps> = ({ members }) => {
  const sorted = members.sort((a, b) => (
    a.team.localeCompare(b.team) || a.surname.localeCompare(b.surname)
  ));

  return (
    <div className='unit-table'>
      <div className='unit-table-header unit-table-row'>
        <div className=' unit-table-cell unit-table-name'>Name</div>
        <div className=' unit-table-cell unit-table-team'>Team</div>
        <div className=' unit-table-cell unit-table-quals'>Qualifications</div>
      </div>
      <div className='unit-table-body'>
        <AutoSizer>
          {({ width, height }) => (
            <FixedSizeList
              width={width}
              height={height}
              itemData={sorted}
              itemCount={sorted.length}
              itemSize={32}
            >
              {UnitTableRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

interface Params {
  member: string;
  week?: string;
}

const ManageMember: React.FC = () => {
  const params = useParams<Params>();
  const history = useHistory();

  let week: Interval;

  if (params.week === undefined) {
    week = getWeekInterval();
  } else {
    week = getWeekInterval(DateTime.fromISO(params.week, { zone: TIME_ZONE }));
  }

  const { loading, error, data } = useQuery<GetMembersAvailabilitiesData, GetMembersAvailabilitiesVars>(
    GET_MEMBERS_AVAILABILITIES_QUERY,
    {
      variables: {
        start: week.start.toJSDate(),
        end: week.end.toJSDate(),
      },
    },
  );

  const handleChangeWeek = (value: Interval) => {
    history.push(`/unit/storm/${value.start.toISODate()}`);
  };

  return (
    <Page title='Storm and Support'>
      <div className='d-flex align-items-center border-bottom p-3'>
        <WeekBrowser value={week} onChange={handleChangeWeek} />
      </div>
      {(() => {
        if (loading) {
          return (
            <Alert variant='info' className='m-3'>
              <Spinner size='sm' animation='border' /> Loading unit availability&hellip;
            </Alert>
          );
        }

        if (error || !data) {
          return (
            <Alert variant='danger' className='m-3'> Error loading unit availability.</Alert>
          );
        }

        return <UnitTable members={data.members} />;
      })()}
    </Page>
  );
};

export default ManageMember;
