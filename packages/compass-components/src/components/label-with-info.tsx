import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { Label } from '@leafygreen-ui/typography';
import { spacing } from '@leafygreen-ui/tokens';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';

const infoButtonStyles = css({
  verticalAlign: 'middle',
  marginTop: -spacing[2],
  marginBottom: -spacing[2],
});

type LabelWithInfoProps = {
  'aria-label': string;
  href: string;
} & React.ComponentProps<typeof Label>;

function LabelWithInfo(props: LabelWithInfoProps): JSX.Element {
  const { 'aria-label': ariaLabel, href } = props;

  return (
    <>
      <Label {...props}>
        {props.children}
        <IconButton
          as="a"
          className={infoButtonStyles}
          aria-label={ariaLabel}
          href={href}
          target="_blank"
        >
          <Icon glyph="InfoWithCircle" size="small" />
        </IconButton>
      </Label>
    </>
  );
}

export { LabelWithInfo };
