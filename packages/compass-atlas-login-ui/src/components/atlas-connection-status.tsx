import React from 'react';
import {
  Body,
  Button,
  Icon,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  useAtlasSignedInUser,
  useAtlasLoginActions,
} from '../stores/store-context';

const containerStyles = css({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[200],
  padding: `${spacing[200]}px ${spacing[400]}px`,
});

const labelStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[150],
  flex: 1,
  minWidth: 0,
});

const signedInDotStyles = css({
  width: spacing[200],
  height: spacing[200],
  borderRadius: '50%',
  backgroundColor: palette.green.dark1,
  flexShrink: 0,
});

const labelTextStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const disconnectButtonStyles = css({
  color: palette.blue.base,
  backgroundColor: palette.white,
  border: 0,
  '&:hover': {
    backgroundColor: palette.white,
    color: palette.blue.base,
  },
  '& svg': {
    color: palette.blue.base,
  },
});

const labelTextStylesLight = css({ color: palette.gray.dark1 });
const labelTextStylesDark = css({ color: palette.gray.light1 });

export interface AtlasConnectionStatusProps {
  'data-testid'?: string;
}

export const AtlasConnectionStatus: React.FunctionComponent<
  AtlasConnectionStatusProps
> = ({ 'data-testid': dataTestId = 'atlas-connection-status' }) => {
  const darkMode = useDarkMode();
  const userInfo = useAtlasSignedInUser();
  const { disconnect } = useAtlasLoginActions();

  if (!userInfo) {
    return null;
  }

  return (
    <div className={containerStyles} data-testid={dataTestId}>
      <div className={labelStyles}>
        <span className={signedInDotStyles} />
        <Body
          className={cx(
            labelTextStyles,
            darkMode ? labelTextStylesDark : labelTextStylesLight
          )}
          data-testid={`${dataTestId}-label`}
        >
          Signed in to Atlas
        </Body>
      </div>
      <Button
        className={disconnectButtonStyles}
        size="xsmall"
        leftGlyph={<Icon glyph="Disconnect" />}
        onClick={disconnect}
        data-testid={`${dataTestId}-disconnect`}
        darkMode={darkMode}
      >
        Disconnect Atlas
      </Button>
    </div>
  );
};
