import QualificationBadge from '../components/QualificationBadge';
import RankImage from '../components/RankImage';
import TeamBadge from '../components/TeamBadge';
import { AvailabilityIncludedFn, calculateMinimumAvailabilities } from '../model/availability';
import { getDayIntervals, getIntervalPosition } from '../model/dates';
import { FEATURED, SUPPRESSED_BY } from '../model/qualifications';
import { MemberWithAvailabilityData } from '../queries/availability';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React, { ReactNode, useState } from 'react';
import Measure from 'react-measure';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface UnitTableRowProps extends ListChildComponentProps {
  data: MemberWithAvailabilityData[];
  week: Interval;
  days: Interval[];
  featuredQualifications: string[];
  renderMember?: (interval: Interval, member: MemberWithAvailabilityData) => ReactNode;
}

const UnitTableRow: React.FC<UnitTableRowProps> = props => {
  const { data, week, days, index, style, featuredQualifications, renderMember } = props;

  const member = data[index];
  const interval = Interval.fromDateTimes(days[0].start, days[days.length - 1].end);

  return (
    <div className='unit-table-row' style={style}>
      <div className='unit-table-cell unit-table-name'>
        <a title={member.number.toString()}>{member.fullName}</a> <RankImage rank={member.rank} width={8} height={16} />
      </div>
      <div className='unit-table-cell unit-table-team'>
        <TeamBadge team={member.team} />
      </div>
      {featuredQualifications.length > 0 && (
        <div className='unit-table-cell unit-table-quals d-none d-xl-flex'>
          {
            featuredQualifications
              .filter(qual => member.qualifications.includes(qual))
              .filter(qual => !member.qualifications.includes(SUPPRESSED_BY[qual]))
              .map(qual => <QualificationBadge key={qual} qualification={qual} className='mr-1' />)
          }
        </div>
      )}
      <div className='unit-table-days'>
        {days.map(({ start }) => (
          <div key={start.toString()} className='unit-table-day'>
            {_.range(4).map(i => (
              <div key={i} className='unit-table-day-block' />
            ))}
          </div>
        ))}
        {renderMember ? renderMember(interval, member) : null}
        {(week.start > interval.start) && (
          <div
            className='unit-table-bound'
            style={{ left: 0, width: (100 * getIntervalPosition(interval, week.start)) + '%' }}
          />
        )}
        {(week.end < interval.end) && (
          <div
            className='unit-table-bound'
            style={{ right: 0, width: (100 * (1 - getIntervalPosition(interval, week.end))) + '%' }}
          />
        )}
      </div>
    </div>
  );
}

export interface UnitTableFooter {
  title?: string;
  included: AvailabilityIncludedFn;
  highlightLessThan?: number;
}

export interface UnitTableProps {
  className?: string;
  interval: Interval;
  members: MemberWithAvailabilityData[];
  featuredQualifications?: string[];
  renderMember?: (interval: Interval, member: MemberWithAvailabilityData) => ReactNode;
  sort?: (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => number;
  footers?: UnitTableFooter[];
}

const UnitTable: React.FC<UnitTableProps> = props => {
  const { className, interval, members, sort, renderMember, footers } = props;

  const defaultSort = (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => (
    a.team.localeCompare(b.team) || a.surname.localeCompare(b.surname)
  );
  const sorted = members.sort(sort || defaultSort);

  // We split the interval into days, then make each day start at 6AM and finish at 6AM of the
  // next day.
  const days = getDayIntervals(interval);

  // Are we showing qualifications?
  const featuredQualifications = props.featuredQualifications || FEATURED;

  // We need to track the scrollbar to offset the header and footer.
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  return (
    <div className={clsx(className, 'unit-table')}>
      <div className='unit-table-header unit-table-row' style={{ paddingRight: scrollbarWidth }}>
        <div className='unit-table-cell unit-table-name'>Name</div>
        <div className='unit-table-cell unit-table-team'>Team</div>
        {featuredQualifications.length > 0 && (
          <div className='unit-table-cell unit-table-quals d-none d-xl-flex'>Qualifications</div>
        )}
        <div className='unit-table-days'>
          {days.map(({ start }) => (
            <div key={start.toString()} className='unit-table-cell unit-table-day'>
              {start.toLocaleString(DateTime.DATE_SHORT)}
            </div>
          ))}
        </div>
      </div>
      <Measure client offset onResize={rect => (
        setScrollbarWidth((rect.offset?.width || 0) - (rect.client?.width || 0))
      )}>
        {({ measureRef }) => (
          <div className='unit-table-body'>
            <AutoSizer>
              {({ width, height }) => (
                <FixedSizeList
                  width={width}
                  height={height}
                  itemData={sorted}
                  itemCount={sorted.length}
                  itemSize={32}
                  outerRef={measureRef}
                >
                  {props => (
                    <UnitTableRow
                      days={days}
                      week={interval}
                      featuredQualifications={featuredQualifications || []}
                      renderMember={renderMember}
                      {...props}
                    />
                  )}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
        )}
      </Measure>
      {footers && footers.map(({ title, included, highlightLessThan }, i) => {
        // We figure out the minimum number of members available at any one time for each block.
        const counts = days.map(day => calculateMinimumAvailabilities(
          day.divideEqually(4), members, included
        ));

        return (
          <div
            key={i}
            className='unit-table-footer unit-table-row'
            style={{ paddingRight: scrollbarWidth }}
          >
            <div className='unit-table-cell unit-table-name'>{title}</div>
            <div className='unit-table-cell unit-table-team'></div>
            {featuredQualifications.length > 0 && (
              <div className='unit-table-cell unit-table-quals d-none d-xl-flex'></div>
            )}
            <div className='unit-table-days'>
              {_.zip(days, counts).map(([day, counts]) => (
                <div key={day!.start.toString()} className='unit-table-day'>
                  {counts!.map((count, i) => (
                    <div
                      key={i}
                      className={clsx('unit-table-day-block',{
                        'text-danger': highlightLessThan !== undefined && count < highlightLessThan,
                      })}
                    >
                      {count}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default UnitTable;
