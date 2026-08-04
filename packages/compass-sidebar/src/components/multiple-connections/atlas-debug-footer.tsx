import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Button,
  HorizontalRule,
  Icon,
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type {
  AtlasAuthService,
  AtlasUserInfo,
} from '@mongodb-js/atlas-service/provider';
import { getAtlasAuthService } from '../../modules';

const footerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  padding: spacing[300],
  flexShrink: 0,
});

const emailRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[150],
});

const signedInDotStyles = css({
  width: spacing[200],
  height: spacing[200],
  borderRadius: '50%',
  backgroundColor: palette.green.dark1,
  flexShrink: 0,
});

const emailTextStylesLight = css({
  color: palette.gray.dark1,
});

const emailTextStylesDark = css({
  color: palette.gray.light1,
});

type AtlasDebugFooterProps = {
  getAtlasAuthService: () => AtlasAuthService;
};

export const AtlasDebugFooter: React.FunctionComponent<
  AtlasDebugFooterProps
> = ({ getAtlasAuthService }) => {
  const darkMode = useDarkMode();
  // The service is stable for the lifetime of the plugin, resolve it once.
  const [atlasAuthService] = useState(() => getAtlasAuthService());
  const [userInfo, setUserInfo] = useState<AtlasUserInfo | null>(null);

  // Synchronize the footer with the external Atlas auth service: load the
  // current signed-in user and keep it in sync via the service's events.
  useEffect(() => {
    let cancelled = false;

    // Use getUserInfo() as the source of truth rather than isAuthenticated():
    // getUserInfo reads the cached signed-in user, whereas isAuthenticated
    // performs a token introspection network call that can be unreliable in
    // some environments. getUserInfo throws when not signed in.
    const refresh = async () => {
      try {
        const userInfo = await atlasAuthService.getUserInfo();
        if (!cancelled) {
          setUserInfo(userInfo);
        }
      } catch {
        if (!cancelled) {
          setUserInfo(null);
        }
      }
    };

    // Perform an initial refresh to load the current signed-in user, and then
    // listen for changes to the signed-in state via the service's events.
    void refresh();

    const onSignedIn = () => void refresh();
    const onSignedOut = () => setUserInfo(null);

    atlasAuthService.on('signed-in', onSignedIn);
    atlasAuthService.on('signed-out', onSignedOut);

    // Cleanup the event listeners when the component is unmounted.
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
    <>
      <HorizontalRule />
      <div className={footerStyles} data-testid="atlas-debug-footer">
        <div className={emailRowStyles}>
          <span className={signedInDotStyles} />
          <Body
            className={darkMode ? emailTextStylesDark : emailTextStylesLight}
            data-testid="atlas-debug-footer-user"
          >
            Signed in to Atlas
          </Body>
        </div>
        <Button
          size="small"
          leftGlyph={<Icon glyph="Disconnect" />}
          onClick={onDisconnect}
          data-testid="atlas-debug-footer-disconnect"
        >
          Disconnect Atlas for debugging
        </Button>
      </div>
    </>
  );
};

export default connect(null, {
  getAtlasAuthService,
})(AtlasDebugFooter);
