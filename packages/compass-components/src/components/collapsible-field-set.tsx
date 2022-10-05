import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { Link, Checkbox, Label } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';

const infoLinkStyles = css({
  marginLeft: spacing[1],
});

const collapsibleFieldsetStyles = css({
  margin: `${spacing[3]}px 0`,
  fieldset: {
    paddingLeft: `${spacing[4]}px`,
  },
  'fieldset fieldset': {
    paddingLeft: 0,
    margin: `${spacing[3]}px 0`,
  },
});

const checkboxStyles = css({
  padding: `${spacing[2]}px 0`,
});

export type CollapsibleFieldSetProps = {
  dataTestId?: string;
  children?: React.ReactElement;
  label: string;
  description?: React.ReactElement | string;
  disabled?: boolean;
  helpUrl?: string;
  onToggle: (checked: boolean) => void;
  toggled?: boolean;
};

export const CollapsibleFieldSet = ({
  description,
  disabled,
  helpUrl,
  label,
  onToggle,
  toggled,
  dataTestId,
  children,
}: React.PropsWithChildren<CollapsibleFieldSetProps>): React.ReactElement => {
  const labelId = dataTestId || 'collapsible-fieldset-props';
  return (
    <fieldset
      className={collapsibleFieldsetStyles}
      data-testid={`${labelId}-fieldset`}
    >
      <Checkbox
        data-testid={labelId}
        onChange={(event) => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={<Label htmlFor={labelId}>{label}</Label>}
        description={
          !description
            ? ''
            : ((
                <>
                  {description}
                  {!!helpUrl && (
                    <Link
                      className={infoLinkStyles}
                      href={helpUrl}
                      aria-label={label}
                    >
                      Learn More
                    </Link>
                  )}
                </>
              ) as any) // LG Checkbox expects a string description, but we use Description component to include helpUrl.
        }
        checked={toggled}
        id={labelId}
        className={checkboxStyles}
      />
      {toggled && <fieldset>{children}</fieldset>}
    </fieldset>
  );
};
