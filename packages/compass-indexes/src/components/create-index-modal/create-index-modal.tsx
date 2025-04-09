import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  Link,
  palette,
} from '@mongodb-js/compass-components';
import {
  fieldAdded,
  fieldRemoved,
  fieldTypeUpdated,
  updateFieldName,
  errorCleared,
  createIndexFormSubmitted,
  createIndexClosed,
} from '../../modules/create-index';
import { CreateIndexForm } from '../create-index-form/create-index-form';
import CreateIndexActions from '../create-index-actions';
import type { RootState } from '../../modules';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import { fireExperimentViewed, TestName } from '@mongodb-js/compass-utils';

type CreateIndexModalProps = React.ComponentProps<typeof CreateIndexForm> & {
  isVisible: boolean;
  namespace: string;
  error: string | null;
  onErrorBannerCloseClick: () => void;
  onCreateIndexClick: () => void;
  onCancelCreateIndexClick: () => void;
};

function CreateIndexModal({
  isVisible,
  namespace,
  error,
  onErrorBannerCloseClick,
  onCreateIndexClick,
  onCancelCreateIndexClick,
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
  const showIndexesGuidanceVariant = usePreference(
    'showIndexesGuidanceVariant'
  );

  fireExperimentViewed({
    testName: TestName.earlyJourneyIndexesGuidance,
    shouldFire: enableInIndexesGuidanceExp || true,
  });

  return (
    <Modal
      open={isVisible}
      setOpen={onSetOpen}
      data-testid="create-index-modal"
      size={showIndexesGuidanceVariant ? 'large' : 'default'}
    >
      {showIndexesGuidanceVariant ? (
        <ModalHeader
          title="Create Index"
          subtitle={
            <span style={{ color: palette.gray.dark1 }}>
              The best indexes for your application should consider a number of
              factors, such as your data model, and the queries you use most
              often. To learn more about indexing best practices, read the{' '}
              <Link
                href="https://docs.mongodb.com/manual/applications/indexes/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Index Strategies Documentation
              </Link>
              .
            </span>
          }
          useLeafyGreenStyling={true}
        />
      ) : (
        <ModalHeader title="Create Index" subtitle={namespace} />
      )}

      <ModalBody>
        <CreateIndexForm namespace={namespace} {...props} />
      </ModalBody>

      <ModalFooter>
        <CreateIndexActions
          error={error}
          onErrorBannerCloseClick={onErrorBannerCloseClick}
          onCreateIndexClick={onCreateIndexClick}
          onCancelCreateIndexClick={onCancelCreateIndexClick}
        />
      </ModalFooter>
    </Modal>
  );
}

const mapState = ({ namespace, serverVersion, createIndex }: RootState) => {
  const { fields, error, isVisible } = createIndex;
  return {
    fields,
    error,
    isVisible,
    namespace,
    serverVersion,
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
};

export default connect(mapState, mapDispatch)(CreateIndexModal);
