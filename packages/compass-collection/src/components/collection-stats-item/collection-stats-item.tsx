import React from 'react';
import {
  css,
  palette,
  spacing,
  Disclaimer,
  H3,
  useDarkMode,
} from '@mongodb-js/compass-components';

const statsItemContainerStyles = css({
  paddingLeft: spacing[1],
  paddingRight: spacing[1],
  flexBasis: 'auto',
  flexGrow: 0,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'flex-end',
  marginBottom: 0,
  '&:last-child': {
    borderRight: 'none',
  },
});

const collectionStatsItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  textAlign: 'center',
  marginRight: spacing[3] - spacing[1],
});

const darkThemeLabelStyles = css({
  textTransform: 'uppercase',
  color: palette.gray.light1,
  display: 'inline-block',
  fontWeight: 'bold',
});

const lightThemeLabelStyles = css({
  textTransform: 'uppercase',
  color: palette.gray.dark1,
  display: 'inline-block',
});

const darkThemeValueStyles = css({
  textTransform: 'lowercase',
  color: palette.green.base,
  display: 'inline-block',
});

const lightThemeValueStyles = css({
  textTransform: 'lowercase',
  color: palette.green.dark2,
  display: 'inline-block',
});

type CollectionStatsItemProps = {
  label: string;
  value: string;
  ['data-testid']?: string;
};

/**
 * Component for a single collection stats item.
 */
const CollectionStatsItem: React.FunctionComponent<
  CollectionStatsItemProps
> = ({
  ['data-testid']: dataTestId,
  label,
  value,
}: CollectionStatsItemProps) => {
  const darkMode = useDarkMode();

  return (
    <div
      data-testid={`${dataTestId}-stats-item`}
      className={statsItemContainerStyles}
    >
      <div
        className={collectionStatsItemStyles}
        data-testid={`${dataTestId}-count`}
      >
        <H3
          className={darkMode ? darkThemeValueStyles : lightThemeValueStyles}
          data-testid={`${dataTestId}-count-value`}
        >
          {value}
        </H3>
        <Disclaimer
          className={darkMode ? darkThemeLabelStyles : lightThemeLabelStyles}
          data-testid={`${dataTestId}-count-label`}
        >
          {label}
        </Disclaimer>
      </div>
    </div>
  );
};

export default CollectionStatsItem;
