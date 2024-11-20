import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Icon,
  Link,
  MarketingModal,
  SpinLoader,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { AiImageBanner } from './ai-image-banner';
import { closeSignInModal, signIn } from '../store/atlas-signin-reducer';
import type { RootState } from '../store/atlas-ai-store';

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

const disclaimerStyles = css({
  padding: `0 ${spacing[900]}px`,
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
        <div className={disclaimerStyles}>
          This is a feature powered by generative AI, and may give inaccurate
          responses. Please see our{' '}
          <Link hideExternalIcon={false} href={GEN_AI_FAQ_LINK} target="_blank">
            FAQ
          </Link>{' '}
          for more information.
        </div>
      }
      graphic={<AiImageBanner></AiImageBanner>}
      title={
        <div className={titleStyles}>
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
      <Body>
        Atlas users can now quickly create queries and aggregations with
        MongoDB&apos;s&nbsp; intelligent AI-powered feature, available today in
        Compass.
      </Body>
    </MarketingModal>
  );
};

export default connect(
  (state: RootState) => {
    return {
      isSignInModalVisible: state.signIn.isModalOpen,
      isSignInInProgress: state.signIn.state === 'in-progress',
    };
  },
  { onSignInModalClose: closeSignInModal, onSignInClick: signIn }
)(AISignInModal);
