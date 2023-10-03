import React from 'react';
import {
  Badge,
  Banner,
  Button,
  Icon,
  KeylineCard,
  Label,
  SpinLoader,
  Subtitle,
  Toggle,
  css,
  palette,
  spacing,
  useDarkMode,
  cx,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../stores';
import {
  disableAIFeature,
  enableAIFeature,
  signIn,
  signOut,
} from '../../stores/atlas-login';

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

const atlasLoginToggleControlContainerStyles = css({
  padding: spacing[3],
  display: 'grid',
  gridTemplateColumns: '100%',
  gap: spacing[3],
});

const atlasLoginToggleControlStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const atlasLoginToggleControlLabelStyles = css({
  fontWeight: 'normal',
});

export const AtlasLoginSettings: React.FunctionComponent<{
  isSignInInProgress: boolean;
  userLogin: string | null;
  isAIFeatureEnabled: boolean;
  onSignInClick(): void;
  onSignOutClick(): void;
  onToggleAIFeature(newValue: boolean): void;
}> = ({
  isSignInInProgress,
  userLogin,
  isAIFeatureEnabled,
  onSignInClick,
  onSignOutClick,
  onToggleAIFeature,
}) => {
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
          <Badge variant="blue">Preview</Badge>
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
            <>You must first connect your Atlas account to use this feature.</>
          )}
        </div>
      </div>
      <div className={atlasLoginToggleControlContainerStyles}>
        <div className={atlasLoginToggleControlStyles}>
          <Toggle
            id="use-ai-toggle"
            disabled={!isSignedIn}
            checked={isAIFeatureEnabled}
            onChange={onToggleAIFeature}
            aria-labelledby="use-ai-toggle-label"
            size="small"
          ></Toggle>
          <Label
            id="use-ai-toggle-label"
            htmlFor="use-ai-toggle"
            className={atlasLoginToggleControlLabelStyles}
          >
            Enable natural language prompts to generate queries and
            aggregations.
          </Label>
        </div>
        {isSignedIn && !isAIFeatureEnabled && (
          <Banner>
            When enabling artificial intelligence features, you will be required
            to understand and agree to our terms of service and privacy policy
            regarding how your data is handled by our artificial intelligence
            partner(s).
          </Banner>
        )}
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
    onToggleAIFeature(newValue: boolean) {
      if (newValue === true) {
        return enableAIFeature();
      } else {
        return disableAIFeature();
      }
    },
  }
)(AtlasLoginSettings);
