import React, { useCallback, useEffect, useState } from 'react';
import {
  Body,
  Button,
  ConfirmationModalVariant,
  Icon,
  css,
  cx,
  openToast,
  palette,
  showConfirmation,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useAtlasAuthService } from '../provider';
import type { AtlasUserInfo } from '../util';

const DISCONNECT_TOAST_ID = 'atlas-disconnected';

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
  'data-testid'?: string;
}

/**
 * Shows the current Atlas sign-in status and a control to disconnect. Renders
 * nothing while signed out. Reads the shared AtlasAuthService from context and
 * stays in sync via its sign-in/out events
 */
export const AtlasConnectionStatus: React.FunctionComponent<
  AtlasConnectionStatusProps
> = ({ 'data-testid': dataTestId = 'atlas-connection-status' }) => {
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
      const confirmed = await showConfirmation({
        title: 'Are you sure you want to disconnect Atlas?',
        description:
          "Once Atlas is disconnected you won't have Atlas context anymore.",
        variant: ConfirmationModalVariant.Danger,
        buttonText: 'Disconnect',
      });
      if (!confirmed) {
        return;
      }
      try {
        await atlasAuthService.signOut();
      } finally {
        setUserInfo(null);
      }
      openToast(DISCONNECT_TOAST_ID, {
        title: 'Disconnected from Atlas',
        description: "You won't have Atlas context anymore.",
        variant: 'note',
        timeout: 5000,
      });
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
          Signed in to Atlas
        </Body>
      </div>
      <Button
        size="xsmall"
        leftGlyph={<Icon glyph="Disconnect" />}
        onClick={onDisconnect}
        data-testid={`${dataTestId}-disconnect`}
      >
        Disconnect Atlas
      </Button>
    </div>
  );
};
