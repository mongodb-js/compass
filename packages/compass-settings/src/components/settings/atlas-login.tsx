import React from 'react';
import {
  Button,
  Icon,
  KeylineCard,
  Link,
  SpinLoader,
  css,
  palette,
  spacing,
  useDarkMode,
  cx,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../stores';
import { signIn, signOut } from '../../stores/atlas-login';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

const atlasLoginKeylineCardStyles = css({
  overflow: 'hidden',
});

const atlasLoginHeaderStyles = css({
  display: 'grid',
  gridTemplateAreas: `
  "heading controls"
  "description description"
  `,
  gridTemplateColumns: `1fr auto`,
  gap: spacing[2],
  padding: `${spacing[2]}px ${spacing[3]}px`,
  boxShadow: `inset 0 -1px 0 ${palette.gray.light2}`,
  backgroundColor: palette.gray.light3,
});

const atlasLoginHeaderDarkModeStyles = css({
  backgroundColor: palette.gray.dark3,
  boxShadow: `inset 0 -1px 0 ${palette.gray.dark2}`,
});

const atlasLoginHeadingTitleStyles = css({
  display: 'flex',
  gap: spacing[1],
  gridArea: 'heading',
  fontWeight: 700,
});

const atlasLoginControlsStyles = css({
  gridArea: 'controls',
});

const atlasLoginHeaderDescriptionStyles = css({
  gridArea: 'description',
});

const atlasLoginEmailStyles = css({
  fontWeight: 500,
});

export const AtlasLoginSettings: React.FunctionComponent<{
  isSignInInProgress: boolean;
  userLogin: string | null;
  isAIFeatureEnabled: boolean;
  onSignInClick(): void;
  onSignOutClick(): void;
}> = ({ isSignInInProgress, userLogin, onSignInClick, onSignOutClick }) => {
  const darkMode = useDarkMode();
  const isSignedIn = userLogin !== null;

  return (
    <KeylineCard className={atlasLoginKeylineCardStyles}>
      <div
        className={cx(
          atlasLoginHeaderStyles,
          darkMode && atlasLoginHeaderDarkModeStyles
        )}
      >
        <div className={atlasLoginHeadingTitleStyles}>
          <Icon glyph="Sparkle" />
          <span>
            You must log in with an Atlas account to use natural language
            prompts.
          </span>
        </div>
        <div className={atlasLoginControlsStyles}>
          {isSignedIn && (
            <Button
              type="button"
              variant="dangerOutline"
              size="small"
              onClick={onSignOutClick}
              disabled={isSignInInProgress}
            >
              Disconnect
            </Button>
          )}
          {!isSignedIn && (
            <Button
              type="button"
              variant="primary"
              size="small"
              leftGlyph={<Icon glyph="OpenNewTab"></Icon>}
              onClick={onSignInClick}
              disabled={isSignInInProgress}
            >
              Log in with Atlas
              {isSignInInProgress && (
                <>
                  &nbsp;<SpinLoader></SpinLoader>
                </>
              )}
            </Button>
          )}
        </div>
        <div
          className={atlasLoginHeaderDescriptionStyles}
          data-testid="atlas-login-status"
        >
          {isSignedIn ? (
            <div data-testid="atlas-signed-in-successful">
              Logged in with Atlas account{' '}
              <span className={atlasLoginEmailStyles}>{userLogin}</span>
            </div>
          ) : (
            <>
              This is a feature powered by generative AI, and may give
              inaccurate responses. Please see our{' '}
              <Link
                hideExternalIcon={false}
                href={GEN_AI_FAQ_LINK}
                target="_blank"
              >
                FAQ
              </Link>{' '}
              for more information.
            </>
          )}
        </div>
      </div>
    </KeylineCard>
  );
};

export const ConnectedAtlasLoginSettings = connect(
  (state: RootState) => {
    return {
      isSignInInProgress: state.atlasLogin.status === 'in-progress',
      userLogin: state.atlasLogin.userInfo?.login ?? null,
      isAIFeatureEnabled: Boolean(state.atlasLogin.userInfo?.enabledAIFeature),
    };
  },
  {
    onSignInClick: signIn,
    onSignOutClick: signOut,
  }
)(AtlasLoginSettings);
