import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import { ModalInput, ModalCheckbox, ModalStatusMessage } from 'hadron-react-components';
import Collation from 'components/collation';
import { changeCappedSize } from 'modules/create-database/capped-size';
import { changeCollectionName } from 'modules/create-database/collection-name';
import { changeDatabaseName } from 'modules/create-database/name';
import { createDatabase } from 'modules/create-database';
import { changeCollationOption } from 'modules/create-database/collation';
import { toggleIsCapped } from 'modules/create-database/is-capped';
import { toggleIsCustomCollation } from 'modules/create-database/is-custom-collation';
import { hideCreateDatabase } from 'modules/create-database/is-visible';
import { openLink } from 'modules/link';

import styles from './create-database-modal.less';

/**
 * The more information url.
 */
const INFO_URL_CREATE_DB =
  'https://docs.mongodb.com/manual/faq/fundamentals/#how-do-i-create-a-database-and-a-collection';

/**
 * The help icon for capped collections url.
 */
const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * The modal to create a database.
 */
class CreateDatabaseModal extends PureComponent {
  static displayName = 'CreateDatabaseModalComponent';

  static propTypes = {
    isCapped: PropTypes.bool.isRequired,
    isCustomCollation: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    error: PropTypes.object,
    collation: PropTypes.object.isRequired,
    collectionName: PropTypes.string.isRequired,
    cappedSize: PropTypes.string.isRequired,
    openLink: PropTypes.func.isRequired,
    changeCappedSize: PropTypes.func.isRequired,
    changeCollectionName: PropTypes.func.isRequired,
    changeCollationOption: PropTypes.func.isRequired,
    changeDatabaseName: PropTypes.func.isRequired,
    createDatabase: PropTypes.func.isRequired,
    toggleIsCapped: PropTypes.func.isRequired,
    toggleIsCustomCollation: PropTypes.func.isRequired,
    hideCreateDatabase: PropTypes.func.isRequired
  }

  /**
   * Called when the collection name changes.
   *
   * @param {Object} evt - The event.
   */
  onCollectionNameChange = (evt) => {
    this.props.changeCollectionName(evt.target.value);
  }

  /**
   * Called when the db name changes.
   *
   * @param {Object} evt - The event.
   */
  onNameChange = (evt) => {
    this.props.changeDatabaseName(evt.target.value);
  }

  /**
   * Called when the capped size changes.
   *
   * @param {Object} evt - The event.
   */
  onCappedSizeChange = (evt) => {
    this.props.changeCappedSize(evt.target.value);
  }

  /**
   * Called when is capped changes.
   */
  onToggleIsCapped = () => {
    this.props.toggleIsCapped(!this.props.isCapped);
  }

  /**
   * Called when is custom collation changes.
   */
  onToggleIsCustomCollation = () => {
    this.props.toggleIsCustomCollation(!this.props.isCustomCollation);
  }

  /**
   * Called when info is clicked.
   *
   * @param {Object} evt - The event.
   */
  onInfoClicked = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.openLink(INFO_URL_CREATE_DB);
  }

  /**
   * Render the capped size component when capped is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCappedSize() {
    if (this.props.isCapped) {
      return (
        <div className={classnames(styles['create-database-modal-is-capped-wrapper'])}>
          <ModalInput
            id="capped-size-value"
            name="Maximum Size (Bytes)"
            value={this.props.cappedSize}
            onChangeHandler={this.onCappedSizeChange} />
        </div>
      );
    }
  }

  /**
   * Render the collation component when collation is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCollation() {
    if (this.props.isCustomCollation) {
      return (
        <Collation
          changeCollationOption={this.props.changeCollationOption}
          collation={this.props.collation} />
      );
    }
  }

  /**
   * Render the modal dialog.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <Modal
        show={this.props.isVisible}
        backdrop="static"
        onHide={this.props.hideCreateDatabase}
        dialogClassName={classnames(styles['create-database-modal'])}>

        <Modal.Header>
          <Modal.Title>Create Database</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form
            name="create-database-modal-form"
            onSubmit={() => {}}
            data-test-id="create-database-modal">

            <ModalInput
              autoFocus
              id="create-database-name"
              name="Database Name"
              value={this.props.name}
              onChangeHandler={this.onNameChange} />
            <ModalInput
              id="create-database-collection-name"
              name="Collection Name"
              value={this.props.collectionName}
              onChangeHandler={this.onCollectionNameChange} />
            <div className="form-group">
              <ModalCheckbox
                name="Capped Collection"
                titleClassName={classnames(styles['create-database-modal-is-capped'])}
                checked={this.props.isCapped}
                helpUrl={HELP_URL_CAPPED}
                onClickHandler={this.onToggleIsCapped}
                onLinkClickHandler={this.props.openLink} />
              {this.renderCappedSize()}
              <ModalCheckbox
                name="Use Custom Collation"
                titleClassName={classnames(styles['create-database-modal-is-custom-collation'])}
                checked={this.props.isCustomCollation}
                helpUrl={HELP_URL_COLLATION}
                onClickHandler={this.onToggleIsCustomCollation}
                onLinkClickHandler={this.props.openLink} />
              {this.renderCollation()}
            </div>
            <div className={classnames(styles['create-database-modal-notice'])}>
              Before MongoDB can save your new database, a collection name
              must also be specified at the time of creation.
              <a onClick={this.onInfoClicked}>More Information</a>
            </div>
            {this.props.error ?
              <ModalStatusMessage icon="times" message={this.props.error.message} type="error" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="cancel-create-database-button"
            text="Cancel"
            clickHandler={this.props.hideCreateDatabase} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="create-database-button"
            text="Create Database"
            clickHandler={this.props.createDatabase} />
        </Modal.Footer>
      </Modal>
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
const mapStateToProps = (state) => ({
  isCapped: state.isCapped,
  isCustomCollation: state.isCustomCollation,
  isVisible: state.isVisible,
  name: state.name,
  collation: state.collation,
  collectionName: state.collectionName,
  cappedSize: state.cappedSize,
  error: state.error
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateDatabaseModal = connect(
  mapStateToProps,
  {
    changeCappedSize,
    changeCollectionName,
    changeDatabaseName,
    changeCollationOption,
    createDatabase,
    hideCreateDatabase,
    openLink,
    toggleIsCapped,
    toggleIsCustomCollation
  },
)(CreateDatabaseModal);

export default MappedCreateDatabaseModal;
export { CreateDatabaseModal };
