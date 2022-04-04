import React from 'react';
import { css, uiColors, spacing, Disclaimer, Overline, withTheme } from '@mongodb-js/compass-components';

const collectionStatsItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  textAlign: 'center',
  marginRight: spacing[3] - spacing[1],
});

const darkThemeLabelStyles = css({
  textTransform: 'uppercase',
  fontSize: '10px',
  fontWeight: 'bold',
  display: 'inline-block',
  color: uiColors.gray.base,
});

const lightThemeLabelStyles = css({
  textTransform: 'uppercase',
  fontSize: '10px',
  fontWeight: 'bold',
  display: 'inline-block',
  color: uiColors.gray.dark2,
});

const darkThemeValueStyles = css({
  color: uiColors.green.light2,
  display: 'inline-block',
  fontSize: '24px',
  lineHeight: '24px',
});

const lightThemeValueStyles = css({
  color: uiColors.green.base,
  display: 'inline-block',
  fontSize: '24px',
  lineHeight: '24px',
});

type CollectionStatsItemProps = {
  darkMode?: boolean;
  label: string;
  value: any;
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
          className={darkMode? darkThemeLabelStyles : lightThemeLabelStyles}
          data-testid={`${dataTestId}-label`}
        >
          {label}
        </Disclaimer>
      </div>
    );
  };

export default withTheme(CollectionStatsItem);
