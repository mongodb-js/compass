import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { useId } from '@react-aria/utils';
import { Link, Checkbox, Label } from './leafygreen';
import FormFieldContainer from './form-field-container';

const infoLinkStyles = css({
  marginLeft: spacing[1],
});

const fieldsetStyles = css({
  paddingLeft: spacing[4],
});

export type CollapsibleFieldSetProps = {
  ['data-testid']?: string;
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
  children,
  ...props
}: React.PropsWithChildren<CollapsibleFieldSetProps>): React.ReactElement => {
  const checkboxId = useId();
  return (
    <FormFieldContainer data-testid={props['data-testid']}>
      <Checkbox
        data-testid={props['data-testid'] && `${props['data-testid']}-checkbox`}
        onChange={(event) => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={
          <Label
            htmlFor={checkboxId}
            data-testid={
              props['data-testid'] && `${props['data-testid']}-label`
            }
          >
            {label}
          </Label>
        }
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
        id={checkboxId}
      />
      {toggled && <fieldset className={fieldsetStyles}>{children}</fieldset>}
    </FormFieldContainer>
  );
};
