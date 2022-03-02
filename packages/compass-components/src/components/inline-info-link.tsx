import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

import { Icon, IconButton } from './leafygreen';

const infoButtonStyles = css({
  marginTop: -spacing[2],
  marginBottom: -spacing[2],
});

type InlineInfoLinkProps = {
  'aria-label': string;
  href: string;
};

function InlineInfoLink(props: InlineInfoLinkProps): JSX.Element {
  const { 'aria-label': ariaLabel, href } = props;

  return (
    <>
      <IconButton
        as="a"
        className={infoButtonStyles}
        aria-label={ariaLabel}
        href={href}
        target="_blank"
      >
        <Icon glyph="InfoWithCircle" size="small" />
      </IconButton>
    </>
  );
}

export { InlineInfoLink };
