import React from 'react';
import { css, Icon, Link, spacing } from '@mongodb-js/compass-components';

const FEEDBACK_URL = 'https://feedback.mongodb.com/forums/924283-compass';

const linkContainerStyles = css({
  paddingTop: spacing[1600],
  paddingBottom: spacing[400],
  textAlign: 'center',
});

const linkContentStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

export const FeedbackLink = () => {
  return (
    <div className={linkContainerStyles}>
      <Link target={'blank'} href={FEEDBACK_URL} hideExternalIcon>
        <div className={linkContentStyles}>
          <Icon glyph="Megaphone" />
          <span>Suggest a new use case</span>
        </div>
      </Link>
    </div>
  );
};
