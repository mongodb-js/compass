import React, { useCallback, useEffect, useState } from 'react';
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
import { useAtlasAuthService } from '../provider';
import type { AtlasUserInfo } from '../util';

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

const labelTextStylesLight = css({ color: palette.gray.dark1 });
const labelTextStylesDark = css({ color: palette.gray.light1 });

export interface AtlasConnectionStatusProps {
  signedInLabel?: string;
  disconnectLabel?: string;
  'data-testid'?: string;
}

/**
 * Shows the current Atlas sign-in status and a control to disconnect. Renders
 * nothing while signed out. Reads the shared AtlasAuthService from context and
 * stays in sync via its sign-in/out events. Labels are configurable so it can
 * be reused across surfaces.
 */
export const AtlasConnectionStatus: React.FunctionComponent<
  AtlasConnectionStatusProps
> = ({
  signedInLabel = 'Signed in to Atlas',
  disconnectLabel = 'Disconnect Atlas',
  'data-testid': dataTestId = 'atlas-connection-status',
}) => {
  const darkMode = useDarkMode();
  const atlasAuthService = useAtlasAuthService();
  const [userInfo, setUserInfo] = useState<AtlasUserInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const info = await atlasAuthService.getUserInfo();
        if (!cancelled) {
          setUserInfo(info);
        }
      } catch {
        if (!cancelled) {
          setUserInfo(null);
        }
      }
    };

    void refresh();

    const onSignedIn = () => void refresh();
    const onSignedOut = () => setUserInfo(null);

    atlasAuthService.on('signed-in', onSignedIn);
    atlasAuthService.on('signed-out', onSignedOut);

    return () => {
      cancelled = true;
      atlasAuthService.off('signed-in', onSignedIn);
      atlasAuthService.off('signed-out', onSignedOut);
    };
  }, [atlasAuthService]);

  const onDisconnect = useCallback(() => {
    void (async () => {
      try {
        await atlasAuthService.signOut();
      } finally {
        setUserInfo(null);
      }
    })();
  }, [atlasAuthService]);

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
          {signedInLabel}
        </Body>
      </div>
      <Button
        size="xsmall"
        leftGlyph={<Icon glyph="Disconnect" />}
        onClick={onDisconnect}
        data-testid={`${dataTestId}-disconnect`}
      >
        {disconnectLabel}
      </Button>
    </div>
  );
};
