import React from 'react';
import {
  css,
  Icon,
  Link,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';

const FEEDBACK_URL = 'https://feedback.mongodb.com/';

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
  const t = useTranslation();
  return (
    <div className={linkContainerStyles}>
      <Link target={'blank'} href={FEEDBACK_URL} hideExternalIcon>
        <div className={linkContentStyles}>
          <Icon glyph="Megaphone" />
          <span>
            {t(
              'aggregations.sidePanel.suggestUseCase',
              'Suggest a new use case'
            )}
          </span>
        </div>
      </Link>
    </div>
  );
};
