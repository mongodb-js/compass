import React from 'react';
import { css, Banner, spacing, Button } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { areAllFieldsFilledIn } from '../../utils/create-index-modal-validation';
import type { Field } from '../../modules/create-index';
import type { RootState } from '../../modules';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: spacing[200],
});

const bannerStyles = css({
  flexGrow: 1,
  width: '100%',
});

const createIndexButtonStyles = css({
  flex: 'none',
});

/**
 * Create index actions.
 */
function CreateIndexActions({
  error,
  onErrorBannerCloseClick,
  onCreateIndexClick,
  onCancelCreateIndexClick,
  fields,
}: {
  error: string | null;
  onErrorBannerCloseClick: () => void;
  onCreateIndexClick: () => void;
  onCancelCreateIndexClick: () => void;
  fields: Field[];
}) {
  const track = useTelemetry();

  const isCreateIndexButtonDisabled = !areAllFieldsFilledIn(fields);

  return (
    <div className={containerStyles}>
      {error && (
        <div
          data-testid="create-index-actions-error-banner-wrapper"
          className={bannerStyles}
        >
          <Banner
            variant="danger"
            dismissible
            onClose={onErrorBannerCloseClick}
          >
            {error}
          </Banner>
        </div>
      )}

      <Button
        data-testid="create-index-actions-cancel-button"
        onClick={() => {
          onCancelCreateIndexClick();
          track('Cancel Button Clicked', {
            context: 'Create Index Modal',
          });
        }}
      >
        Cancel
      </Button>
      <Button
        data-testid="create-index-actions-create-index-button"
        onClick={onCreateIndexClick}
        variant="primary"
        className={createIndexButtonStyles}
        disabled={isCreateIndexButtonDisabled}
      >
        Create Index
      </Button>
    </div>
  );
}

const mapState = ({ createIndex }: RootState) => {
  const { fields } = createIndex;
  return {
    fields,
  };
};

export default connect(mapState)(CreateIndexActions);
