import React from 'react';
import {
  Button,
  Icon,
  KeylineCard,
  Link,
  SpinLoader,
  Subtitle,
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
  padding: spacing[3],
  boxShadow: `inset 0 -1px 0 ${palette.gray.light2}`,
  backgroundColor: palette.gray.light3,
});

const atlasLoginHeaderDarkModeStyles = css({
  backgroundColor: palette.gray.dark3,
  boxShadow: `inset 0 -1px 0 ${palette.gray.dark2}`,
});

const atlasLoginHeadingTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  gridArea: 'heading',
});

const atlasLoginControlsStyles = css({
  gridArea: 'controls',
});

const atlasLoginHeaderDescriptionStyles = css({
  gridArea: 'description',
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
        <Subtitle className={atlasLoginHeadingTitleStyles}>
          <Icon glyph="Sparkle" />
          <span>Use Generative AI</span>
        </Subtitle>
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
            <>Logged in with Atlas account {userLogin}</>
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
