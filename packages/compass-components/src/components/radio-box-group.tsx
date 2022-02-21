import React from 'react';
import { RadioBoxGroup as LeafyGreenRadioBoxGroup } from '@leafygreen-ui/radio-box-group';
import { Label } from '@leafygreen-ui/typography';

type BasicRadioGroupProps = React.ComponentProps<
  typeof LeafyGreenRadioBoxGroup
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

function RadioBoxGroup({ label, ...props }: RadioBoxGroupProps): JSX.Element {
  const { id } = props;

  if (!label || !id) {
    return <LeafyGreenRadioBoxGroup {...props} />;
  }

  if (typeof label === 'string') {
    const labelId = `${id}-label`;
    return (
      <>
        <Label htmlFor={id} id={labelId}>
          {label}
        </Label>
        <LeafyGreenRadioBoxGroup aria-labelledby={labelId} {...props} />
      </>
    );
  }

  return (
    <>
      {label}
      <LeafyGreenRadioBoxGroup {...props} />
    </>
  );
}

export { RadioBoxGroup };
