import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
} from '@mongodb-js/compass-components';
import type { Tab } from '../../modules/create-index';
import {
  fieldAdded,
  fieldRemoved,
  fieldTypeUpdated,
  updateFieldName,
  errorCleared,
  createIndexFormSubmitted,
  createIndexClosed,
  tabUpdated,
} from '../../modules/create-index';
import { CreateIndexForm } from '../create-index-form/create-index-form';
import CreateIndexActions from '../create-index-actions';
import type { RootState } from '../../modules';
import {
  useTrackOnChange,
  type TrackFunction,
  useFireExperimentViewed,
  TestName,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import CreateIndexModalHeader from './create-index-modal-header';

type CreateIndexModalProps = React.ComponentProps<typeof CreateIndexForm> & {
  isVisible: boolean;
  namespace: string;
  error: string | null;
  currentTab: Tab;
  query: string | null;
  onErrorBannerCloseClick: () => void;
  onCreateIndexClick: () => void;
  onCancelCreateIndexClick: () => void;
  onTabClick: (tab: Tab) => void;
};

function CreateIndexModal({
  isVisible,
  namespace,
  error,
  currentTab,
  onErrorBannerCloseClick,
  onCreateIndexClick,
  onCancelCreateIndexClick,
  query,
  ...props
}: CreateIndexModalProps) {
  const connectionInfoRef = useConnectionInfoRef();
  const onSetOpen = useCallback(
    (open) => {
      if (!open) {
        onCancelCreateIndexClick();
      }
    },
    [onCancelCreateIndexClick]
  );

  useTrackOnChange(
    (track: TrackFunction) => {
      const connectionInfo = connectionInfoRef.current;
      if (isVisible) {
        track('Screen', { name: 'create_index_modal' }, connectionInfo);
        track(
          'Index Create Opened',
          {
            atlas_search: false,
          },
          connectionInfo
        );
      }
    },
    [isVisible, connectionInfoRef],
    undefined
  );

  // @experiment Early Journey Indexes Guidance & Awareness  | Jira Epic: CLOUDP-239367
  const enableInIndexesGuidanceExp = usePreference('enableIndexesGuidanceExp');
  const showIndexesGuidanceVariant =
    usePreference('showIndexesGuidanceVariant') && enableInIndexesGuidanceExp;

  useFireExperimentViewed({
    testName: TestName.earlyJourneyIndexesGuidance,
    shouldFire: enableInIndexesGuidanceExp && isVisible,
  });

  return (
    <Modal
      open={isVisible}
      setOpen={onSetOpen}
      data-testid="create-index-modal"
      size={showIndexesGuidanceVariant ? 'large' : 'default'}
    >
      {showIndexesGuidanceVariant ? (
        <CreateIndexModalHeader />
      ) : (
        <ModalHeader title="Create Index" subtitle={namespace} />
      )}

      <ModalBody>
        <CreateIndexForm
          {...props}
          namespace={namespace}
          showIndexesGuidanceVariant={showIndexesGuidanceVariant}
          currentTab={currentTab}
          query={query}
        />
      </ModalBody>

      <ModalFooter>
        <CreateIndexActions
          error={error}
          onErrorBannerCloseClick={onErrorBannerCloseClick}
          onCreateIndexClick={onCreateIndexClick}
          onCancelCreateIndexClick={onCancelCreateIndexClick}
          showIndexesGuidanceVariant={showIndexesGuidanceVariant}
        />
      </ModalFooter>
    </Modal>
  );
}

const mapState = ({ namespace, serverVersion, createIndex }: RootState) => {
  const { fields, error, isVisible, currentTab, query } = createIndex;
  return {
    fields,
    error,
    isVisible,
    namespace,
    serverVersion,
    currentTab,
    query,
  };
};

const mapDispatch = {
  onErrorBannerCloseClick: errorCleared,
  onCreateIndexClick: createIndexFormSubmitted,
  onCancelCreateIndexClick: createIndexClosed,
  onAddFieldClick: fieldAdded,
  onRemoveFieldClick: fieldRemoved,
  onSelectFieldNameClick: updateFieldName,
  onSelectFieldTypeClick: fieldTypeUpdated,
  onTabClick: tabUpdated,
};

export default connect(mapState, mapDispatch)(CreateIndexModal);
