import classnames from 'classnames';
import React from 'react';

const AvailableCell = ({ id, available, onChange }) => {
  const classes = ['shift'];

  if (available === true) {
    classes.push('table-success');
  } else if (available === false) {
    classes.push('table-danger');
  }

  return (
    <td className={classnames(classes)}>
      <label htmlFor={id}>
        <input
          type='checkbox'
          id={id}
          checked={available === true}
          onChange={e => onChange(e.target.checked)}
        />
      </label>
    </td>
  );
};

export default AvailableCell;
