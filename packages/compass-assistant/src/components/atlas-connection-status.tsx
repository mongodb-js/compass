import React, { useCallback, useEffect, useState } from 'react';
import {
  Body,
  ConfirmationModalVariant,
  Icon,
  Link,
  css,
  cx,
  palette,
  showConfirmation,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  useAtlasLoginActions,
  useAtlasSignInStatus,
} from '@mongodb-js/atlas-service/provider';
import { useAtlasAdminApi } from '../compass-assistant-provider';

const containerStyles = css({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[200],
  padding: `${spacing[200]}px ${spacing[400]}px`,
  backgroundColor: palette.gray.light3,
  borderBottom: `1px solid ${palette.gray.light2}`,
});

const darkModeContainerStyles = css({
  backgroundColor: palette.gray.dark4,
  borderBottom: `1px solid ${palette.gray.dark2}`,
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

const linkStyles = css({
  '> span': { display: 'flex', alignItems: 'center', gap: spacing[100] },
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
  const atlasAdminApi = useAtlasAdminApi();
  const signInStatus = useAtlasSignInStatus();
  const { signOut } = useAtlasLoginActions();
  const sub = signInStatus.user?.sub;

  const [atlasUser, setAtlasUser] = useState<{
    sub: string;
    username?: string;
  }>();

  useEffect(() => {
    if (!sub) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        // This is a temporary implementation since username is only required here. If you need to retrieve the username somewhere else, merge together with the existing userInfo data.
        const { user } = await atlasAdminApi.getSystemStatus();
        if (!cancelled) {
          setAtlasUser({ sub, username: user?.username });
        }
      } catch {
        // Fall back to the generic label.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [atlasAdminApi, sub]);

  const username = atlasUser?.sub === sub ? atlasUser?.username : undefined;

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

  if (!signInStatus.user) {
    return null;
  }

  return (
    <div
      className={cx(containerStyles, darkMode && darkModeContainerStyles)}
      data-testid={dataTestId}
    >
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
          {username ?? 'Signed in to Atlas'}
        </Body>
      </div>
      <Link
        as="button"
        onClick={handleDisconnect}
        data-testid={`${dataTestId}-disconnect`}
        darkMode={darkMode}
        className={cx(linkStyles)}
      >
        <Icon glyph="Disconnect" />
        Disconnect Atlas
      </Link>
    </div>
  );
};
