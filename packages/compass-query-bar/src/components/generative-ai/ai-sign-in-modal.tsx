import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../stores/query-bar-store';
import { signIn, closeSignInModal } from '../../stores/atlas-signin-reducer';
import {
  Badge,
  Button,
  Link,
  Modal,
  SpinLoader,
  Subtitle,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import { AISignInImageBanner } from './ai-sign-in-banner-image';

type SignInModalProps = {
  isSignInModalVisible?: boolean;
  isSignInInProgress?: boolean;
  onSignInModalClose?: () => void;
  onSignInClick?: () => void;
};

const modalContentStyles = css({
  width: 400,
  overflow: 'hidden',
});

const containerStyles = css({
  padding: spacing[4],
});

const titleStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const descriptionStyles = css({});

const controlsStyles = css({
  display: 'flex',
});

const buttonStyles = css({
  flex: 'none',
});

const maybeLaterButtonStyles = css({
  marginLeft: 'auto',
  borderColor: 'transparent !important',
});

const AISignInModal: React.FunctionComponent<SignInModalProps> = ({
  isSignInModalVisible = false,
  isSignInInProgress = false,
  onSignInModalClose,
  onSignInClick,
}) => {
  return (
    <Modal
      open={isSignInModalVisible}
      setOpen={(open) => {
        if (open === false) {
          onSignInModalClose?.();
        }
      }}
      contentClassName={modalContentStyles}
    >
      <AISignInImageBanner></AISignInImageBanner>
      <div className={containerStyles}>
        <Subtitle className={titleStyles}>
          Build faster with AI&nbsp;<Badge>Experimental</Badge>
        </Subtitle>
        <div className={descriptionStyles}>
          <p>
            Atlas users can now quickly generate queries and aggregations with
            MongoDB’s AI-powered features, available today in Compass.
          </p>
          <p>
            This feature is an experiment and may give inaccurate responses. You
            can help make it better by leaving feedback.
          </p>
          <p>
            To understand how your data is used with AI partners,{' '}
            <Link href="https://example.com">learn more in the docs</Link>.
          </p>
        </div>
        <div className={controlsStyles}>
          <Button
            variant="primary"
            onClick={onSignInClick}
            className={buttonStyles}
            disabled={isSignInInProgress}
            // TODO: will have to update leafygreen for that
            // isLoading={isSignInInProgress}
          >
            Log in to enable AI
            {isSignInInProgress && (
              <>
                &nbsp;<SpinLoader></SpinLoader>
              </>
            )}
          </Button>
          <Button
            variant="primaryOutline"
            onClick={onSignInModalClose}
            className={cx(buttonStyles, maybeLaterButtonStyles)}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default connect(
  (state: RootState) => {
    return {
      isSignInModalVisible: state.atlasSignIn.isModalOpen,
      isSignInInProgress: state.atlasSignIn.state === 'in-progress',
    };
  },
  { onSignInModalClose: closeSignInModal, onSignInClick: signIn }
)(AISignInModal);
