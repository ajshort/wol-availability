import React from 'react';
import Button, { ButtonProps } from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export interface RadioButtonGroupProps<T> {
  options: Array<{ value: T; label: string; variant: string; }>;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}

class RadioButtonGroup<T> extends React.Component<RadioButtonGroupProps<T>> {
  public render() {
    const { options, value, onChange } = this.props;

    return (
      <ButtonGroup>
        {options.map(({ value: mine, label, variant }) => {
          const style = value === mine ? variant : `outline-${variant}`;
          const handleClick = () => onChange(value === mine ? undefined : mine);

          return (
            <Button key={label} variant={style as ButtonProps['variant']} onClick={handleClick}>
              {label}
            </Button>
          );
        })}
      </ButtonGroup>
    );
  }
}

export default RadioButtonGroup;
