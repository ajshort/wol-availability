import { getIntervalPosition } from '../model/dates';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React from 'react';
import Measure, { ContentRect } from 'react-measure';

interface IntervalSelectionProps {
  interval: Interval;
  selections?: Interval[];
}

interface IntervalSelectionState {
  width: number;

  drag?: {
    origin: number;
    selection: Interval;
    bounds: Interval;
    updated: Interval | null;
    start: boolean;
    end: boolean;
  };
}

class IntervalSelection extends React.Component<IntervalSelectionProps, IntervalSelectionState> {
  constructor(props: IntervalSelectionProps) {
    super(props);
    this.state = { width: 0 };
  }

  componentDidUpdate(_: IntervalSelectionProps, prev: IntervalSelectionState) {
    if (!prev.drag && this.state.drag) {
      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    } else if (prev.drag && !this.state.drag) {
      document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  handleMouseDown(e: React.MouseEvent<HTMLDivElement>, selection: Interval, bounds: Interval) {
    if (e.button !== 0) {
      return;
    }

    const element = e.target as HTMLDivElement;

    this.setState({
      ...this.state,
      drag: {
        origin: e.clientX,
        selection,
        bounds,
        updated: selection,
        start: !element.classList.contains('interval-selection-drag-end'),
        end: !element.classList.contains('interval-selection-drag-start'),
      },
    });

    e.preventDefault();
  }

  handleMouseMove(e: MouseEvent) {
    if (this.state.drag === undefined) {
      return;
    }

    const { drag } = this.state;
    const dx = e.clientX - drag.origin;
    const ms = (dx / this.state.width) * this.props.interval.length('milliseconds');

    const round = (dt: DateTime) => {
      return dt.set({
        minute: Math.round(dt.minute / 15) * 15,
        second: 0,
        millisecond: 0,
      });
    };

    const updated = Interval
      .fromDateTimes(
        drag.start ? round(drag.selection.start.plus({ milliseconds: ms })) : drag.selection.start,
        drag.end ? round(drag.selection.end.plus({ milliseconds: ms })) : drag.selection.end,
      )
      .intersection(drag.bounds);

    this.setState({ ...this.state, drag: { ...drag, updated } });
  }

  handleMouseUp(e: MouseEvent) {
    this.setState({ ...this.state, drag: undefined });
  }

  render() {
    const { interval, selections } = this.props;
    const { drag } = this.state;

    // For each selection in the bounds, we need to figure out the minimum and maximum bound
    // that it can be moved to.
    const display = (selections || [])
      .map(selection => selection.intersection(interval))
      .filter(intersection => intersection && !intersection.isEmpty())
      .map(intersection => ({
        interval: intersection!,
        bounds: interval,
      }));

    const handleResize = (rect: ContentRect) => {
      this.setState({ ...this.state, width: rect.bounds!.width });
    };

    return (
      <Measure bounds onResize={handleResize}>
        {({ measureRef }) => (
          <div ref={measureRef} className='interval-selection'>
            {display.map((selection) => {
              // Are we currently being dragged?
              const dragged = drag && selection.interval.equals(drag.selection);
              const draw = dragged ? drag!.updated : selection.interval;

              if (draw === null) {
                return null;
              }

              const left = `${100 * getIntervalPosition(interval, draw.start)}%`;
              const right = `${100 * (1 - getIntervalPosition(interval, draw.end))}%`;
              const style = { left, right };

              const className = clsx({
                'interval-selection-selection': true,
                'interval-selection-dragging': dragged,
              });

              return (
                <div
                  key={interval.toString()}
                  className={className}
                  style={style}
                  onMouseDown={(e) => this.handleMouseDown(e, selection.interval, selection.bounds)}
                >
                  <div className='interval-selection-drag-start' />
                  <span className='interval-selection-from'>{draw.start.toLocaleString(DateTime.TIME_24_SIMPLE)}</span>
                  <span className='interval-selection-to'>{draw.end.toLocaleString(DateTime.TIME_24_SIMPLE)}</span>
                  <div className='interval-selection-drag-end' />
                </div>
              );
            })}
          </div>
        )}
      </Measure>
    );
  }
}

export interface WeekTableProps {
  interval: Interval;
  children: (row: Interval) => React.ReactNode;
  selections?: Interval[];
  onChangeSelections?: (intervals: Interval[]) => void;
}

const WeekTable: React.FC<WeekTableProps> = props => {
  const { children, interval, selections, onChangeSelections } = props;

  // We split the interval into days, then make each day start at 6AM and finish at 6AM of the
  // next day.
  const rows = _
    .range(0, interval.count('days'))
    .map(i => interval.start.startOf('day').plus({ days: i }))
    .map(dt => Interval.fromDateTimes(dt.set({ hour: 6 }), dt.plus({ days: 1 }).set({ hour: 6 })));

  // Display each day as 4 columns. This used to switch dynamically.
  const columns = 4;
  const times = rows[0].divideEqually(columns);

  const handleSelect = (selected: Interval[]) => {
    if (!onChangeSelections) {
      return;
    }

    // If we've already selected all of them, de-select them. Otherwise select them.
    const existing = selections || [];
    const engulfed = selected.every(sel => (existing.some(container => container.engulfs(sel))));

    if (engulfed) {
      onChangeSelections(Interval.xor([...existing, ...selected]));
    } else {
      onChangeSelections(Interval.merge([...existing, ...selected]));
    }
  };

  const handleRowClick = (row: Interval) => {
    handleSelect([row]);
  };

  const handleColumnClick = (time: Interval) => {
    handleSelect(rows
      .map(row => {
        const base = (time.start.hour < 6) ? row.end : row.start;
        const start = base.set({ hour: time.start.hour });

        return Interval.fromDateTimes(start, start.plus({ hours: 24 / columns }))
      })
      .filter(selection => selection.overlaps(interval))
    );
  };

  const className = clsx({
    'week-table': true,
    'week-table-selectable': onChangeSelections !== undefined,
  });

  return (
    <Measure bounds>
      {({ measureRef }) => (
        <div className={className} ref={measureRef}>
          <div className='week-table-head'>
            {times.map((time, index) => (
              <div key={index} className='week-table-time' onClick={() => handleColumnClick(time)}>
                <small>{_.padStart(time.start.hour.toString(), 2, '0') + ':00'}</small>
              </div>
            ))}
          </div>
          {rows.map(row => (
            <div key={row.toString()} className='week-table-row'>
              <div className='week-table-date' onClick={() => handleRowClick(row)}>
                <span className='text-muted'>{row.start.toFormat('ccc')}</span>
                <span className='h5 mb-0'>{row.start.toFormat('d')}</span>
              </div>
              <div className='week-table-container'>
                {times.map((_time, index) => (
                  <div
                    key={index}
                    className={clsx({
                      'week-table-hour': true,
                      'week-table-last-hour': (index === times.length - 1),
                    })}
                  />
                ))}
                {children(row)}
                <IntervalSelection
                  interval={row}
                  selections={selections}
                />
                {(interval.start > row.start) && (
                  <div
                    className='week-table-bound'
                    style={{ left: 0, width: (100 * getIntervalPosition(row, interval.start)) + '%' }}
                  />
                )}
                {(interval.end < row.end) && (
                  <div
                    className='week-table-bound'
                    style={{ right: 0, width: (100 * (1 - getIntervalPosition(row, interval.end))) + '%' }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Measure>
  );
};

export default WeekTable;
