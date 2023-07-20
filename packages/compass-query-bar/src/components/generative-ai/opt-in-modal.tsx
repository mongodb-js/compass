import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../stores/query-bar-store';
import { signIn } from '../../stores/atlas-signin-reducer';
import { hideOptIn } from '../../stores/ai-query-reducer';
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
import { OptInImageBanner } from './opt-in-banner-image';

type OptInModalProps = {
  isOptInVisible?: boolean;
  isSignInInProgress?: boolean;
  onOptInModalClose?: () => void;
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

const OptInModal: React.FunctionComponent<OptInModalProps> = ({
  isOptInVisible = false,
  isSignInInProgress = false,
  onOptInModalClose,
  onSignInClick,
}) => {
  return (
    <Modal
      open={isOptInVisible}
      setOpen={(open) => {
        if (open === false) {
          onOptInModalClose?.();
        }
      }}
      contentClassName={modalContentStyles}
    >
      <OptInImageBanner></OptInImageBanner>
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
            onClick={onOptInModalClose}
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
      isOptInVisible: state.aiQuery.isOptInVisible,
      isSignInInProgress: state.atlasSignIn.state === 'in-progress',
    };
  },
  { onOptInModalClose: hideOptIn, onSignInClick: signIn }
)(OptInModal);
