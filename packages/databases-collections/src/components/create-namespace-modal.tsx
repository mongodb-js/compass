import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  FormModal,
  Banner,
  Link,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { CreateNamespaceRootState } from '../stores/create-namespace';
import type { CreateNamespaceOptions } from '../modules/create-namespace';
import {
  createNamespace,
  toggleIsVisible,
  clearError,
} from '../modules/create-namespace';
import CollectionFields from './collection-fields';

const collectionNameInfoBanner = css({
  marginTop: spacing[3],
  '&:not(:last-child)': {
    marginBottom: spacing[2],
  },
});

// The more information url.
const INFO_URL_CREATE_DB =
  'https://www.mongodb.com/docs/manual/faq/fundamentals/#how-do-i-create-a-database-and-a-collection-';

type CreateNamespaceModalProps = {
  databaseName?: string | null;
  isRunning: boolean;
  isVisible: boolean;
  error: Error | null;
  createNamespace(data: CreateNamespaceOptions): void;
  toggleIsVisible(newVisible: boolean): void;
  clearError(): void;
  serverVersion: string;
  configuredKMSProviders?: string[];
  currentTopologyType?: string;
};

/**
 * The modal to create a database.
 */
class CreateDatabaseModal extends PureComponent<
  CreateNamespaceModalProps,
  { data: Partial<CreateNamespaceOptions> }
> {
  state = {
    data: {} as Partial<CreateNamespaceOptions>,
  };

  /**
   * Called when the error message close icon is clicked.
   */
  onDismissErrorMessage = () => {
    this.props.clearError();
  };

  onCancel = () => {
    return this.props.toggleIsVisible(false);
  };

  onConfirm = () => {
    this.props.createNamespace(this.state.data as CreateNamespaceOptions);
  };

  onChange = (data: Partial<CreateNamespaceOptions>) => {
    this.setState({ data });
  };

  renderError() {
    if (!this.props.error) {
      return;
    }

    return (
      <Banner variant="danger" dismissible onClose={this.props.clearError}>
        {this.props.error.message}
      </Banner>
    );
  }

  renderCollectionNameRequiredNotice() {
    return (
      <Banner className={collectionNameInfoBanner} variant="info">
        Before MongoDB can save your new database, a collection name must also
        be specified at the time of creation.&nbsp;
        <Link href={INFO_URL_CREATE_DB} target="_blank">
          More Information
        </Link>
      </Banner>
    );
  }

  /**
   * Render the modal dialog.
   */
  render() {
    const isCreateCollection = this.props.databaseName !== null;
    const hasDatabaseName = !!(
      this.props.databaseName ??
      this.state.data.database ??
      ''
    ).trim();
    const hasCollectionName = !!(this.state.data.collection ?? '').trim();
    const modalLabel = isCreateCollection
      ? 'Create Collection'
      : 'Create Database';

    return (
      <FormModal
        title={modalLabel}
        open={this.props.isVisible}
        onSubmit={this.onConfirm}
        onCancel={this.onCancel}
        submitButtonText={modalLabel}
        submitDisabled={!hasCollectionName || !hasDatabaseName}
        data-testid={
          isCreateCollection
            ? 'create-collection-modal'
            : 'create-database-modal'
        }
      >
        <CollectionFields
          serverVersion={this.props.serverVersion}
          withDatabase={!isCreateCollection}
          onChange={this.onChange}
          configuredKMSProviders={this.props.configuredKMSProviders}
          currentTopologyType={this.props.currentTopologyType}
        />
        {!isCreateCollection &&
          !hasCollectionName &&
          this.renderCollectionNameRequiredNotice()}
        {this.renderError()}
      </FormModal>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state: CreateNamespaceRootState) => ({
  databaseName: state.databaseName,
  isCreateCollection: state.databaseName !== null,
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  error: state.error,
  serverVersion: state.serverVersion,
  configuredKMSProviders: state.configuredKMSProviders,
  currentTopologyType: state.currentTopologyType,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateDatabaseModal = connect(mapStateToProps, {
  createNamespace,
  toggleIsVisible,
  clearError,
})(CreateDatabaseModal);

export default MappedCreateDatabaseModal;
export { CreateDatabaseModal };
