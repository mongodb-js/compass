import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Link,
  MarketingModal,
  SpinLoader,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { AISignInImageBanner } from './ai-signin-banner-image';
import {
  closeOptInModal,
  optIn,
  type AtlasOptInState,
} from '../store/atlas-optin-reducer';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

type OptInModalProps = {
  isOptInModalVisible: boolean;
  isOptInInProgress: boolean;
  onOptInModalClose: () => void;
  onOptInClick: () => void;
};

const titleStyles = css({
  marginBottom: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const disclaimer = css({
  padding: `0 ${spacing[900]}px`,
});

const AIOptInModal: React.FunctionComponent<OptInModalProps> = ({
  isOptInModalVisible,
  isOptInInProgress,
  onOptInModalClose,
  onOptInClick,
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
          Use natural language to generate queries and pipelines
        </div>
      }
      open={isOptInModalVisible}
      onClose={onOptInModalClose}
      // @ts-expect-error leafygreen only allows strings, but we need to pass
      // icons
      buttonText={
        <>
          &nbsp;Opt in to Atlas to enable
          {isOptInInProgress && (
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
        if (isOptInInProgress) {
          return;
        }
        onOptInClick();
      }}
      linkText="Cancel"
      onLinkClick={onOptInModalClose}
    >
      <Body>
        Atlas users can now quickly create queries and aggregations with
        MongoDB&apos;s&nbsp; intelligent AI-powered feature, available today.
      </Body>
    </MarketingModal>
  );
};

export default connect(
  (state: AtlasOptInState) => {
    return {
      isOptInModalVisible: state.optInReducer.isModalOpen,
      isOptInInProgress: state.optInReducer.state === 'in-progress',
    };
  },
  { onOptInModalClose: closeOptInModal, onOptInClick: optIn }
)(AIOptInModal);
