import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import TeamBadge from '../components/TeamBadge';
import { FEATURED, SUPPRESSED_BY } from '../model/qualifications';
import { MemberWithAvailabilityData } from '../queries/availability';

import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface UnitTableRowProps extends ListChildComponentProps {
  data: MemberWithAvailabilityData[];
  featuredQualifications: string[];
}

const UnitTableRow: React.FC<UnitTableRowProps> = ({ data, index, style, featuredQualifications }) => {
  const member = data[index];

  return (
    <div className='unit-table-row' style={style}>
      <div className='unit-table-cell unit-table-name'>
        {member.fullName} <RankImage rank={member.rank} width={8} height={16} />
      </div>
      <div className='unit-table-cell unit-table-team'>
        <TeamBadge team={member.team} />
      </div>
      {featuredQualifications.length > 0 && (
        <div className='unit-table-cell unit-table-quals'>
          {
            featuredQualifications
              .filter(qual => member.qualifications.includes(qual))
              .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
              .map(qual => <QualificationBadge key={qual} qualification={qual} className='mr-1' />)
          }
        </div>
      )}
    </div>
  );
}

export interface UnitTableProps {
  interval: Interval;
  members: MemberWithAvailabilityData[];
  featuredQualifications?: string[];
  sort?: (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => number;
}

const UnitTable: React.FC<UnitTableProps> = ({ interval, members, featuredQualifications, sort }) => {
  const defaultSort = (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => (
    a.team.localeCompare(b.team) || a.surname.localeCompare(b.surname)
  );
  const sorted = members.sort(sort || defaultSort);

  // We split the interval into days, then make each day start at 6AM and finish at 6AM of the
  // next day.
  const days = _
    .range(0, interval.count('days'))
    .map(i => interval.start.startOf('day').plus({ days: i }))
    .map(dt => Interval.fromDateTimes(dt.set({ hour: 6 }), dt.plus({ days: 1 }).set({ hour: 6 })));

  // Are we showing qualifications?
  if (featuredQualifications === undefined) {
    featuredQualifications = FEATURED;
  }

  return (
    <div className='unit-table'>
      <div className='unit-table-header unit-table-row'>
        <div className='unit-table-cell unit-table-name'>Name</div>
        <div className='unit-table-cell unit-table-team'>Team</div>
        {featuredQualifications.length > 0 && (
          <div className='unit-table-cell unit-table-quals'>Qualifications</div>
        )}
        {days.map(({ start }) => (
          <div key={start.toString()} className='unit-table-cell unit-table-day'>
            {start.toLocaleString(DateTime.DATE_SHORT)}
          </div>
        ))}
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
              {props => (
                <UnitTableRow featuredQualifications={featuredQualifications || []} {...props} />
              )}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
      <div className='unit-table-footer unit-table-row'>
        <div className='unit-table-cell unit-table-name'>{sorted.length}</div>
        <div className='unit-table-cell unit-table-team'></div>
        {featuredQualifications.length > 0 && (
          <div className='unit-table-cell unit-table-quals'>Qualifications</div>
        )}
      </div>
    </div>
  );
};

export default UnitTable;
