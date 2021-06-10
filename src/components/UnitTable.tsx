import { useAuth } from './AuthContext'
import QualificationBadge from './QualificationBadge';
import RankImage from './RankImage';
import { AvailabilityIncludedFn, calculateMinimumAvailabilities } from '../model/availability';
import { getDayIntervals, getIntervalPosition } from '../model/dates';
import { FEATURED, SUPPRESSED_BY } from '../model/qualifications';
import { MemberWithAvailabilityData } from '../queries/availability';

import clsx from 'clsx';
import _ from 'lodash';
import { Interval } from 'luxon';
import React, { ReactNode, useRef, useState } from 'react';
import Measure from 'react-measure';
import { Link } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface InfoColumnProps {
  key: string;
  heading: string;
  className: string;
  render: (member: MemberWithAvailabilityData) => ReactNode;
}

interface UnitTableRowProps extends ListChildComponentProps {
  data: MemberWithAvailabilityData[];
  week: Interval;
  days: Interval[];
  featuredQualifications: string[];
  infoColumns?: InfoColumnProps[];
  renderMember?: (interval: Interval, member: MemberWithAvailabilityData) => ReactNode;
}

const UnitTableRow: React.FC<UnitTableRowProps> = props => {
  const { data, week, days, index, style, featuredQualifications, infoColumns, renderMember } = props;
  const { unit, member: me } = useAuth();

  const { member, membership } = data[index];
  const interval = Interval.fromDateTimes(days[0].start, days[days.length - 1].end);

  const editable = (unit?.permission === 'EDIT_UNIT') ||
                   (unit?.permission === 'EDIT_TEAM' && unit?.team === membership.team) ||
                   (me?.number === member.number);

  return (
    <div className='unit-table-row' style={style}>
      <div title={member.number.toString()} className='unit-table-cell unit-table-name'>
        {editable ? (
          <Link to={`/member/${member.number}`}>{member.fullName}</Link>
        ) : (
          <>{member.fullName}</>
        )}
        <RankImage rank={member.rank} width={8} height={16} />
      </div>
      {infoColumns && infoColumns.map(column => (
        <div key={column.key} className={clsx('unit-table-cell', column.className)}>
          {column.render(data[index])}
        </div>
      ))}
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
        {renderMember ? renderMember(interval, data[index]) : null}
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
  infoColumns?: InfoColumnProps[];
  renderMember?: (interval: Interval, member: MemberWithAvailabilityData) => ReactNode;
  sort?: (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => number;
  footers?: UnitTableFooter[];
}

const UnitTable: React.FC<UnitTableProps> = props => {
  const { className, interval, members, sort, renderMember, footers, infoColumns } = props;

  const defaultSort = (a: MemberWithAvailabilityData, b: MemberWithAvailabilityData) => (
    (a.membership.team || '').localeCompare(b.membership.team || '') ||
    (a.member.lastName.localeCompare(b.member.lastName))
  );
  const sorted = members.sort(sort || defaultSort);

  // We split the interval into days, then make each day start at 6AM and finish at 6AM of the
  // next day.
  const days = getDayIntervals(interval);

  // Are we showing qualifications?
  const featuredQualifications = props.featuredQualifications || FEATURED;

  // We need to track the scrollbar to offset the header and footer. We also track the horizontal
  // scroll and offset the header and footer.
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const header = useRef<HTMLDivElement>(null);
  const footer = useRef<HTMLDivElement>(null);

  const setScrollLeft = (left: number) => {
    if (header.current) {
      header.current.scrollLeft = left;
    }
    if (footer.current) {
      footer.current.scrollLeft = left;
    }
  }

  return (
    <div className={clsx(className, 'unit-table')}>
      <div className='unit-table-header unit-table-row' ref={header} style={{ paddingRight: scrollbarWidth }}>
        <div className='unit-table-cell unit-table-name'>Name</div>
        {infoColumns && infoColumns.map(column => (
          <div key={column.key} className={clsx('unit-table-cell', column.className)}>
            {column.heading}
          </div>
        ))}
        {featuredQualifications.length > 0 && (
          <div className='unit-table-cell unit-table-quals d-none d-xl-flex'>Qualifications</div>
        )}
        <div className='unit-table-days'>
          {days.map(({ start }) => (
            <div key={start.toString()} className='unit-table-cell unit-table-day'>
              {start.toLocaleString({ weekday: 'short', day: '2-digit'})}
            </div>
          ))}
        </div>
      </div>
      <Measure client offset onResize={rect => (
        setScrollbarWidth((rect.offset?.width || 0) - (rect.client?.width || 0))
      )}>
        {({ measureRef }) => (
          <div className='unit-table-body' onScroll={e => setScrollLeft((e.target as HTMLElement).scrollLeft)}>
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
                      infoColumns={infoColumns}
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
      {footers && (
        <div className='unit-table-footers' ref={footer}>
          {footers.map(({ title, included, highlightLessThan }, i) => {
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
                {infoColumns && infoColumns.map((column) => (
                  <div key={column.key} className={clsx('unit-table-cell', column.className)} />
                ))}
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
      )}
    </div>
  );
};

export default UnitTable;
