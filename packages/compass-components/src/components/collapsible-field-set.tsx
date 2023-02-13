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
  label: React.ReactElement | string;
  description?: React.ReactElement | string;
  disabled?: boolean;
  helpUrl?: string;
  onToggle: (checked: boolean) => void;
  toggled?: boolean;
  id?: string;
};

export const CollapsibleFieldSet = ({
  description,
  disabled,
  helpUrl,
  label,
  onToggle,
  toggled,
  children,
  'data-testid': testId,
  id: _id,
}: React.PropsWithChildren<CollapsibleFieldSetProps>): React.ReactElement => {
  const checkboxId = useId();
  const id = _id ?? checkboxId;
  return (
    <FormFieldContainer data-testid={testId}>
      <Checkbox
        data-testid={testId && `${testId}-checkbox`}
        onChange={(event) => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={
          <Label htmlFor={id} data-testid={testId && `${testId}-label`}>
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
                    // @ts-expect-error leafygreen doesn't allow non-string descriptions
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
        id={id}
      />
      {toggled && <fieldset className={fieldsetStyles}>{children}</fieldset>}
    </FormFieldContainer>
  );
};
