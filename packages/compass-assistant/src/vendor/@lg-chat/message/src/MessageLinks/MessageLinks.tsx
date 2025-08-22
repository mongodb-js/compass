import React from 'react';
import { RichLinksArea } from '@lg-chat/rich-links';

import { useDarkMode } from '@mongodb-js/compass-components';
import { Subtitle } from '@mongodb-js/compass-components';

import {
  containerStyles,
  getDividerStyles,
  linksHeadingStyles,
} from './MessageLinks.styles';
import { type MessageLinksProps } from './MessageLinks.types';

export function MessageLinks({
  darkMode: darkModeProp,
  headingText = 'Related Resources',
  links,
  onLinkClick,
  ...divProps
}: MessageLinksProps) {
  const darkMode = useDarkMode(darkModeProp);
  const theme = darkMode ? Theme.Dark : Theme.Light;
  return (
    <div className={containerStyles} {...divProps}>
      <hr className={getDividerStyles(theme)} />
      <Subtitle className={linksHeadingStyles}>{headingText}</Subtitle>
      <RichLinksArea links={links} onLinkClick={onLinkClick} />
    </div>
  );
}

MessageLinks.displayName = 'MessageLinks';
