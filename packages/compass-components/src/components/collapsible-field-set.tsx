import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { Link, Checkbox, Label } from './leafygreen';
import { useId } from '@react-aria/utils';
import { spacing } from '@leafygreen-ui/tokens';
import { withTheme } from '../hooks/use-theme';
import { Description } from '@leafygreen-ui/typography';

const infoLinkStyles = css({
  marginLeft: spacing[1],
});

const collapsibleFieldsetStyles = css({
  margin: `${spacing[3]}px 0`,
  fieldset: {
    paddingLeft: `${spacing[4]}px`,
  },
});

export type CreateIndexProps = {
  darkMode?: boolean;
  dataTestId?: string;
  children?: React.ReactElement;
  label: string;
  description?: React.ReactElement | string;
  disabled?: boolean;
  helpUrl?: string;
  onToggle: (checked: boolean) => boolean;
  toggled?: boolean;
};

const UnthemedCollapsibleFieldSet = ({
  darkMode,
  description,
  disabled,
  helpUrl,
  label,
  onToggle,
  toggled,
  ...props
}: React.PropsWithChildren<CreateIndexProps>): React.ReactElement => {
  const labelId = useId();
  return (
    <fieldset className={collapsibleFieldsetStyles}>
      <Checkbox
        data-testid={props.dataTestId}
        onChange={(event) => {
          onToggle(event.target.checked);
        }}
        disabled={disabled}
        label={<Label htmlFor={labelId}>{label}</Label>}
        description={
          !description
            ? ''
            : ((
                <Description>
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
                </Description>
              ) as any) // LG Checkbox expects a string description, but we use Description component to include helpUrl.
        }
        checked={toggled}
        id={labelId}
        darkMode={darkMode}
      />
      {toggled && <fieldset>{props.children}</fieldset>}
    </fieldset>
  );
};

const CollapsibleFieldSet = withTheme(UnthemedCollapsibleFieldSet);
export { CollapsibleFieldSet };
