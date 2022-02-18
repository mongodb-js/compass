import React from 'react';
import { RadioBoxGroup as LeafygreenRadioBoxGroup } from '@leafygreen-ui/radio-box-group';
import { Label } from '@leafygreen-ui/typography';

type BasicRadioGroupProps = React.ComponentProps<
  typeof LeafygreenRadioBoxGroup
>;

interface RadioBoxGroupWithoutLabel extends BasicRadioGroupProps {
  id?: string;
  label: never;
}

interface RadioBoxGroupWithLabel extends BasicRadioGroupProps {
  id: string; // We require an id for the label to reference.
  label: string | JSX.Element;
}

type RadioBoxGroupProps = RadioBoxGroupWithoutLabel | RadioBoxGroupWithLabel;

function RadioBoxGroup(props: RadioBoxGroupProps): JSX.Element {
  if (!props.label || !props.id) {
    return <LeafygreenRadioBoxGroup {...props} />;
  }

  const { id, label } = props;

  if (typeof label === 'string') {
    const labelId = `${id}-label`;
    return (
      <>
        <Label htmlFor={id} id={labelId}>
          {label}
        </Label>
        <LeafygreenRadioBoxGroup aria-labelledby={labelId} {...props} />
      </>
    );
  }

  return (
    <>
      {label}
      <LeafygreenRadioBoxGroup {...props} />
    </>
  );
}

export { RadioBoxGroup };
