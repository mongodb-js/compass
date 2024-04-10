import React from 'react';
import { connect } from 'react-redux';
import {
  Badge,
  Body,
  Icon,
  Link,
  MarketingModal,
  SpinLoader,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { AISignInImageBanner } from './ai-signin-banner-image';
import type { AtlasSignInState } from '../store/atlas-signin-reducer';
import { closeSignInModal, signIn } from '../store/atlas-signin-reducer';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

type SignInModalProps = {
  isSignInModalVisible?: boolean;
  isSignInInProgress?: boolean;
  onSignInModalClose?: () => void;
  onSignInClick?: () => void;
};

const titleStyles = css({
  marginBottom: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const paragraphStyles = css({
  marginBottom: spacing[200],
});

const disclaimer = css({
  padding: `0 ${spacing[900]}px`,
});

const previewBadgeStyles = css({
  marginBottom: spacing[400],
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
      disclaimer={
        <div className={disclaimer}>
          This is a feature powered by generative AI, and may give inaccurate
          responses. Please see our{' '}
          <Link hideExternalIcon={false} href={GEN_AI_FAQ_LINK} target="_blank">
            FAQ
          </Link>{' '}
          for more information.
        </div>
      }
      graphic={<AISignInImageBanner></AISignInImageBanner>}
      title={
        <div className={titleStyles}>
          <Badge variant="blue" className={previewBadgeStyles}>
            Preview
          </Badge>
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
      <div>
        <Body className={paragraphStyles}>
          Atlas users can now quickly create queries and aggregations with
          MongoDB&apos;s&nbsp; intelligent AI-powered feature, available today
          in Compass.
        </Body>
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
