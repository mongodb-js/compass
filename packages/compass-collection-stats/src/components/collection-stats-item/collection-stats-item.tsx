import React from 'react';
import {
  css,
  uiColors,
  spacing,
  Disclaimer,
  Overline,
  withTheme,
} from '@mongodb-js/compass-components';

const collectionStatsItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  textAlign: 'center',
  marginRight: spacing[3] - spacing[1],
});

const darkThemeLabelStyles = css({
  textTransform: 'uppercase',
  color: uiColors.gray.light1,
  display: 'inline-block',
  fontWeight: 'bold',
  fontSize: spacing[2] * 1.5,
  lineHeight: `${spacing[3]}px`,
});

const lightThemeLabelStyles = css({
  textTransform: 'uppercase',
  color: uiColors.gray.dark1,
  display: 'inline-block',
  fontSize: spacing[2] * 1.5,
  lineHeight: `${spacing[3]}px`,
});

const darkThemeValueStyles = css({
  textTransform: 'lowercase',
  color: uiColors.green.light2,
  display: 'inline-block',
  fontSize: spacing[4],
  lineHeight: `${spacing[5]}px`,
});

const lightThemeValueStyles = css({
  textTransform: 'lowercase',
  color: uiColors.green.base,
  display: 'inline-block',
  fontSize: spacing[4],
  lineHeight: `${spacing[5]}px`,
});

type CollectionStatsItemProps = {
  darkMode?: boolean;
  label: string;
  value: string;
  dataTestId: string;
};

/**
 * Component for a single collection stats item.
 */
const CollectionStatsItem: React.FunctionComponent<CollectionStatsItemProps> =
  ({ darkMode, dataTestId, label, value }: CollectionStatsItemProps) => {
    return (
      <div className={collectionStatsItemStyles} data-testid={dataTestId}>
        <Overline
          className={darkMode ? darkThemeValueStyles : lightThemeValueStyles}
          data-testid={`${dataTestId}-value`}
        >
          {value}
        </Overline>
        <Disclaimer
          className={darkMode ? darkThemeLabelStyles : lightThemeLabelStyles}
          data-testid={`${dataTestId}-label`}
        >
          {label}
        </Disclaimer>
      </div>
    );
  };

export default withTheme(CollectionStatsItem);
