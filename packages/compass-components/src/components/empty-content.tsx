import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { Body, Subtitle } from './leafygreen';
import { useDarkMode } from '../hooks/use-theme';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  margin: `${spacing[400]}px auto`,
  marginTop: spacing[7],
  padding: `0 ${spacing[400]}px`,
});

const iconStyles = css({
  flex: 'none',
  maxWidth: '80px',
  maxHeight: '80px',
});
const titleStyles = css({
  marginTop: spacing[200],
});
const titleLightStyles = css({
  color: palette.green.dark2,
});
const titleDarkStyles = css({
  color: palette.green.light1,
});
const subTitleStyles = css({
  marginTop: spacing[200],
  maxWidth: spacing[1600] * 6,
});
const callToActionStyles = css({
  marginTop: spacing[600],
  maxWidth: '600px',
});
const callToActionLinkContainerStyles = css({
  marginTop: spacing[400],
  maxWidth: '600px',
});

type EmptyContentProps = {
  icon?: React.FunctionComponent;
  title: string;
  titleClassName?: string;
  subTitle: React.ReactNode;
  subTitleClassName?: string;
  callToAction?: React.ReactNode;
  callToActionLink?: React.ReactNode;
};

const EmptyContent: React.FunctionComponent<
  EmptyContentProps & React.HTMLProps<HTMLDivElement>
> = ({
  icon: Icon,
  title,
  subTitle,
  callToAction,
  callToActionLink,
  titleClassName,
  subTitleClassName,
}) => {
  const darkMode = useDarkMode();

  return (
    <div data-testid="empty-content" className={containerStyles}>
      {Icon && (
        <div className={iconStyles}>
          <Icon />
        </div>
      )}
      <Subtitle
        className={cx(
          titleStyles,
          darkMode ? titleDarkStyles : titleLightStyles,
          titleClassName
        )}
      >
        {title}
      </Subtitle>
      <Body className={cx(subTitleStyles, subTitleClassName)}>{subTitle}</Body>
      {!!callToAction && (
        <div className={callToActionStyles}>
          {typeof callToAction === 'string' ? (
            <Body>{callToAction}</Body>
          ) : (
            <>{callToAction}</>
          )}
        </div>
      )}
      {!!callToActionLink && (
        <div
          className={
            callToAction ? callToActionLinkContainerStyles : callToActionStyles
          }
        >
          {callToActionLink}
        </div>
      )}
    </div>
  );
};

export { EmptyContent };
