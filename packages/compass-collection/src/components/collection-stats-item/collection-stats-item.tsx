import React from 'react';
import {
  css,
  palette,
  spacing,
  Disclaimer,
  H3,
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
  color: palette.green.light2,
  display: 'inline-block',
});

const lightThemeValueStyles = css({
  textTransform: 'lowercase',
  color: palette.green.dark2,
  display: 'inline-block',
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
const CollectionStatsItem: React.FunctionComponent<
  CollectionStatsItemProps
> = ({ darkMode, dataTestId, label, value }: CollectionStatsItemProps) => {
  return (
    <div className={collectionStatsItemStyles} data-testid={dataTestId}>
      <H3
        className={darkMode ? darkThemeValueStyles : lightThemeValueStyles}
        data-testid={`${dataTestId}-value`}
      >
        {value}
      </H3>
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
