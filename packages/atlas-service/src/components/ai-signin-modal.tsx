import React from 'react';
import { connect } from 'react-redux';
import {
  Badge,
  Icon,
  Link,
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

const descriptionStyles = css({
  textAlign: 'start',
});

const descriptionDarkModeStyles = css({
  // Same as above, adjusting dark mode that is for no good reason is different
  // from light mode
  marginLeft: -10,
  marginRight: -10,
});

const paragraphStyles = css({
  margin: 0,
  '&:not(:last-child)': {
    marginBottom: spacing[3],
  },
});

const badgeStyles = css({
  verticalAlign: 'super',
});

const linkStyles = css({
  display: 'inline',
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
      // @ts-expect-error leafygreen only allows strings, but we need to pass
      // badge component
      title={
        <div className={cx(titleStyles, darkMode && titleDarkModeStyles)}>
          Build faster with AI&nbsp;
          <Badge className={badgeStyles} variant="blue">
            Experimental
          </Badge>
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
      <div
        className={cx(descriptionStyles, darkMode && descriptionDarkModeStyles)}
      >
        <p className={paragraphStyles}>
          Atlas users can now quickly generate queries and aggregations with
          MongoDB’s AI-powered features, available today in Compass.
        </p>
        <p className={paragraphStyles}>
          To understand how your data is used with AI partners,{' '}
          <Link
            className={linkStyles}
            href="https://www.mongodb.com/docs/compass/current/faq/#how-do-i-view-and-modify-my-privacy-settings-"
            hideExternalIcon={true}
          >
            learn more in the docs
          </Link>
          .
        </p>
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
