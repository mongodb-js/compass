import React from 'react';
import { css, Banner, spacing, Button } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { areAllFieldsFilledIn } from '../../utils/create-index-modal-validation';
import type { Field, Tab } from '../../modules/create-index';
import type { RootState } from '../../modules';

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
  currentTab,
  showIndexesGuidanceVariant,
  indexSuggestions,
}: {
  error: string | null;
  onErrorBannerCloseClick: () => void;
  onCreateIndexClick: () => void;
  onCancelCreateIndexClick: () => void;
  fields: Field[];
  currentTab: Tab;
  showIndexesGuidanceVariant: boolean;
  indexSuggestions: Record<string, number> | null;
}) {
  let isCreateIndexButtonDisabled = false;

  if (showIndexesGuidanceVariant) {
    // Disable create index button if the user is in Query Flow and has no suggestions
    if (currentTab === 'QueryFlow') {
      if (indexSuggestions === null) {
        isCreateIndexButtonDisabled = true;
      }
    }
    // Or if they are in the Index Flow but have not completed the fields
    else {
      if (!areAllFieldsFilledIn(fields)) {
        isCreateIndexButtonDisabled = true;
      }
    }
  }

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
        onClick={onCancelCreateIndexClick}
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
  const { fields, currentTab, indexSuggestions } = createIndex;
  return {
    fields,
    currentTab,
    indexSuggestions,
  };
};

export default connect(mapState)(CreateIndexActions);
