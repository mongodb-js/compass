import React, { useCallback, useEffect, useState } from 'react';
import {
  Body,
  Button,
  ConfirmationModalVariant,
  Icon,
  css,
  cx,
  palette,
  showConfirmation,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  useAtlasLoginActions,
  useAtlasSignedInUser,
} from '@mongodb-js/atlas-service/provider';
import { useAtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import { useLogger } from '@mongodb-js/compass-logging/provider';

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
  flexShrink: 0,
});

const signedInDotStylesLight = css({ backgroundColor: palette.green.light1 });
const signedInDotStylesDark = css({ backgroundColor: palette.green.dark1 });

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

export const AtlasConnectionStatus: React.FunctionComponent<
  AtlasConnectionStatusProps
> = ({ 'data-testid': dataTestId = 'atlas-connection-status' }) => {
  const darkMode = useDarkMode();
  const atlasAdminApi = useAtlasAdminApiService();
  const { debug } = useLogger('COMPASS-ASSISTANT');
  const userInfo = useAtlasSignedInUser();
  const { signOut } = useAtlasLoginActions();
  const sub = userInfo?.sub;

  const [atlasUsername, setAtlasUsername] = useState<{
    sub: string;
    username?: string;
  }>();

  useEffect(() => {
    if (!sub) {
      return;
    }
    let cancelled = false;
    void (async () => {
      let username: string | undefined;
      try {
        const { user } = await atlasAdminApi.getSystemStatus();
        username = user?.username;
      } catch (err) {
        debug(`Failed to fetch Atlas system status: ${(err as Error).message}`);
      }
      if (!cancelled) {
        setAtlasUsername({ sub, username });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [atlasAdminApi, debug, sub]);

  const handleDisconnect = useCallback(() => {
    void (async () => {
      const confirmedLogout = await showConfirmation({
        title: 'Are you sure you want to disconnect Atlas?',
        description:
          "Once Atlas is disconnected you won't have context from Atlas anymore.",
        variant: ConfirmationModalVariant.Danger,
        buttonText: 'Disconnect',
      });
      if (!confirmedLogout) {
        return;
      }
      await signOut();
    })();
  }, [signOut]);

  if (!userInfo) {
    return null;
  }

  const username =
    atlasUsername?.sub === sub ? atlasUsername?.username : undefined;

  return (
    <div className={containerStyles} data-testid={dataTestId}>
      <div className={labelStyles}>
        <span
          className={cx(
            signedInDotStyles,
            darkMode ? signedInDotStylesDark : signedInDotStylesLight
          )}
        />
        <Body
          className={cx(
            labelTextStyles,
            darkMode ? labelTextStylesDark : labelTextStylesLight
          )}
          data-testid={`${dataTestId}-label`}
        >
          {username
            ? `${username}`
            : 'Signed in to Atlas'}
        </Body>
      </div>
      <Button
        size="xsmall"
        leftGlyph={<Icon glyph="Disconnect" />}
        onClick={handleDisconnect}
        data-testid={`${dataTestId}-disconnect`}
        darkMode={darkMode}
        variant="dangerOutline"
      >
        Disconnect Atlas
      </Button>
    </div>
  );
};
