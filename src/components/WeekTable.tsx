import { getIntervalPosition } from '../model/dates';

import clsx from 'clsx';
import _ from 'lodash';
import { DateTime, Interval } from 'luxon';
import React from 'react';
import Measure, { BoundingRect } from 'react-measure';

interface IntervalSelectionProps {
  interval: Interval;
  selections?: Interval[];
  onClick: (dt: DateTime) => void;
  onChangeSelections?: (selections: Interval[]) => void;
}

interface IntervalSelectionState {
  bounds?: BoundingRect;

  drag?: {
    origin: { x: number; y: number; };
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

    this.state = {};
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
        origin: { x: e.clientX, y: e.clientY },
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
    const dx = e.clientX - drag.origin.x;
    const ms = (dx / this.state.bounds!.width) * this.props.interval.length('milliseconds');

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

  handleContainerMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    // If the mouse hasn't moved from the mouse down point, we consider this a `click`.
    const { drag } = this.state;
    const click = !drag || (drag.origin.x === e.clientX && drag.origin.y === e.clientY);

    if (click) {
      const { interval, onClick } = this.props;
      const dx = (e.clientX - this.state.bounds!.left);
      const t = dx / this.state.bounds!.width;
      const milliseconds = interval.length('milliseconds') * t;

      onClick(interval.start.plus({ milliseconds }));
    }

    this.handleMouseUp(e);
  }

  handleMouseUp(e: MouseEvent | React.MouseEvent<HTMLDivElement>) {
    if (!this.state.drag) {
      return;
    }

    const onChange = this.props.onChangeSelections;

    if (onChange !== undefined) {
      // Did we modify or remove the interval?
      const selections = this.props.selections!;
      const { selection, updated } = this.state.drag;
      
      // The selections with the previous selection removed.
      const removed = Interval.xor([...selections, selection]);

      if (updated === null) {
        onChange(removed);
      } else if (!selection.equals(updated)) {
        onChange(Interval.merge([...removed, updated]));
      }
    }

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

    return (
      <Measure bounds onResize={rect => this.setState({ ...this.state, bounds: rect.bounds })}>
        {({ measureRef }) => (
          <div
            ref={measureRef}
            className='interval-selection'
            onMouseUp={this.handleContainerMouseUp.bind(this)}
          >
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
                  <span className='interval-selection-from'>
                    {draw.start.toLocaleString(DateTime.TIME_24_SIMPLE)}
                  </span>
                  <span className='interval-selection-to'>
                    {draw.end.toLocaleString(DateTime.TIME_24_SIMPLE)}
                  </span>
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

  const handleBodyClick = (row: Interval, dt: DateTime) => {
    if (onChangeSelections === undefined) {
      return;
    }

    const blocks = row.divideEqually(columns);
    const clicked = blocks.find(block => block.contains(dt));

    if (clicked === undefined) {
      return;
    }

    const selected = selections?.find(selection => selection.contains(dt));

    // If it's selected already, we de-select it (limiting it to the selected row).
    if (selected) {
      const clear = rows.find(row => row.contains(dt))!.intersection(selected)!;
      onChangeSelections(Interval.xor([...selections!, clear]));
    } else {
      handleSelect([clicked]);
    }
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
                  onClick={dt => handleBodyClick(row, dt)}
                  onChangeSelections={onChangeSelections}
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
