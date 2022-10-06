import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Link, Checkbox, Label } from './leafygreen';
import FormFieldContainer from './form-field-container';

const infoLinkStyles = css({
  marginLeft: spacing[1],
});

const fieldsetStyles = css({
  paddingLeft: `${spacing[4]}px`,
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
    <FormFieldContainer data-testid={`${labelId}-fieldset`}>
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
      />
      {toggled && <fieldset className={fieldsetStyles}>{children}</fieldset>}
    </FormFieldContainer>
  );
};
