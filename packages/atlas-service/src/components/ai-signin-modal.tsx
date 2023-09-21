import React from 'react';
import { connect } from 'react-redux';
import {
  Badge,
  Body,
  Icon,
  MarketingModal,
  SpinLoader,
  css,
  cx,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { AISignInImageBanner } from './ai-signin-banner-image';
import type { AtlasSignInState } from '../store/atlas-signin-reducer';
import { closeSignInModal, signIn } from '../store/atlas-signin-reducer';

type SignInModalProps = {
  isSignInModalVisible?: boolean;
  isSignInInProgress?: boolean;
  onSignInModalClose?: () => void;
  onSignInClick?: () => void;
};

const titleStyles = css({
  marginBottom: spacing[3],
});

// For whatever reason leafygreen marketing modal doesn't have the same spacing
// between image and title in dark mode
const titleDarkModeStyles = css({
  marginTop: spacing[4],
});

const descriptionDarkModeStyles = css({
  // Same as above, adjusting dark mode that is for no good reason is different
  // from light mode
  marginLeft: -10,
  marginRight: -10,
});

const paragraphStyles = css({
  marginBottom: spacing[2],
});

const AISignInModal: React.FunctionComponent<SignInModalProps> = ({
  isSignInModalVisible = false,
  isSignInInProgress = false,
  onSignInModalClose,
  onSignInClick,
}) => {
  const darkMode = useDarkMode();

  return (
    <MarketingModal
      darkMode={darkMode}
      graphic={<AISignInImageBanner></AISignInImageBanner>}
      // @ts-expect-error leafygreen only allows strings, but we
      // override styles.
      title={
        <div className={cx(titleStyles, darkMode && titleDarkModeStyles)}>
          Use natural language to generate queries and pipelines
        </div>
      }
      open={isSignInModalVisible}
      onClose={onSignInModalClose}
      // @ts-expect-error leafygreen only allows strings, but we need to pass
      // icons
      buttonText={
        <>
          <Icon glyph="LogIn"></Icon>&nbsp;Log in to Atlas to enable
          {isSignInInProgress && (
            <>
              &nbsp;
              <SpinLoader
                // Marketing modal button is always bright, spin loader in dark mode gets lost
                darkMode={false}
              ></SpinLoader>
            </>
          )}
        </>
      }
      onButtonClick={() => {
        // We can't control buttons in marketing modal, so instead we just do
        // nothing when button is clicked and sign in is in progress
        if (isSignInInProgress) {
          return;
        }
        onSignInClick?.();
      }}
      linkText="Not now"
      onLinkClick={onSignInModalClose}
    >
      <div className={cx(darkMode && descriptionDarkModeStyles)}>
        <Body className={paragraphStyles}>
          Atlas users can now quickly create queries and aggregations with
          MongoDB&apos;s&nbsp; intelligent AI-powered feature, available today
          in Compass.
        </Body>
        <Badge variant="blue">Preview</Badge>
      </div>
    </MarketingModal>
  );
};

export default connect(
  (state: AtlasSignInState) => {
    return {
      isSignInModalVisible: state.isModalOpen,
      isSignInInProgress: state.state === 'in-progress',
    };
  },
  { onSignInModalClose: closeSignInModal, onSignInClick: signIn }
)(AISignInModal);
