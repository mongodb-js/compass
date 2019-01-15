import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import { ModalInput, ModalCheckbox, ModalStatusMessage } from 'hadron-react-components';
import Collation from 'components/collation';
import { changeCappedSize } from 'modules/create-collection/capped-size';
import { changeCollectionName } from 'modules/create-collection/name';
import { createCollection } from 'modules/create-collection';
import { changeCollationOption } from 'modules/create-collection/collation';
import { toggleIsCapped } from 'modules/create-collection/is-capped';
import { toggleIsCustomCollation } from 'modules/create-collection/is-custom-collation';
import { toggleIsVisible } from 'modules/is-visible';
import { openLink } from 'modules/link';

import styles from './create-collection-modal.less';

/**
 * The help icon for capped collections url.
 */
const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * The modal to create a collection.
 */
class CreateCollectionModal extends PureComponent {
  static displayName = 'CreateCollectionModalComponent';

  static propTypes = {
    isCapped: PropTypes.bool.isRequired,
    isCustomCollation: PropTypes.bool.isRequired,
    isRunning: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    error: PropTypes.object,
    collation: PropTypes.object.isRequired,
    cappedSize: PropTypes.string.isRequired,
    openLink: PropTypes.func.isRequired,
    changeCappedSize: PropTypes.func.isRequired,
    changeCollectionName: PropTypes.func.isRequired,
    changeCollationOption: PropTypes.func.isRequired,
    createCollection: PropTypes.func.isRequired,
    toggleIsCapped: PropTypes.func.isRequired,
    toggleIsCustomCollation: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired
  }

  /**
   * Called when the db name changes.
   *
   * @param {Object} evt - The event.
   */
  onNameChange = (evt) => {
    this.props.changeCollectionName(evt.target.value);
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
   * When user hits enter to submit the form we need to prevent the default bhaviour.
   *
   * @param {Event} evt - The event.
   */
  onFormSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.createCollection();
  }

  /**
   * Hide the modal.
   */
  onHide = () => {
    this.props.toggleIsVisible(false);
  }

  /**
   * Render the capped size component when capped is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCappedSize() {
    if (this.props.isCapped) {
      return (
        <div className={classnames(styles['create-collection-modal-is-capped-wrapper'])}>
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
        onHide={this.onHide}
        dialogClassName={classnames(styles['create-collection-modal'])}>

        <Modal.Header>
          <Modal.Title>Create Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form
            name="create-collection-modal-form"
            onSubmit={this.onFormSubmit}
            data-test-id="create-collection-modal">

            <ModalInput
              autoFocus
              id="create-collection-name"
              name="Collection Name"
              value={this.props.name}
              onChangeHandler={this.onNameChange} />
            <div className="form-group">
              <ModalCheckbox
                name="Capped Collection"
                titleClassName={classnames(styles['create-collection-modal-is-capped'])}
                checked={this.props.isCapped}
                helpUrl={HELP_URL_CAPPED}
                onClickHandler={this.onToggleIsCapped}
                onLinkClickHandler={this.props.openLink} />
              {this.renderCappedSize()}
              <ModalCheckbox
                name="Use Custom Collation"
                titleClassName={classnames(styles['create-collection-modal-is-custom-collation'])}
                checked={this.props.isCustomCollation}
                helpUrl={HELP_URL_COLLATION}
                onClickHandler={this.onToggleIsCustomCollation}
                onLinkClickHandler={this.props.openLink} />
              {this.renderCollation()}
            </div>
            {this.props.error ?
              <ModalStatusMessage icon="times" message={this.props.error.message} type="error" />
              : null}
            {this.props.isRunning ?
              <ModalStatusMessage icon="spinner" message="Create in Progress" type="in-progress" />
              : null}
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="cancel-create-collection-button"
            text="Cancel"
            clickHandler={this.onHide} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="create-collection-button"
            text="Create Collection"
            clickHandler={this.props.createCollection} />
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
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  name: state.name,
  collation: state.collation,
  cappedSize: state.cappedSize,
  error: state.error
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateCollectionModal = connect(
  mapStateToProps,
  {
    changeCappedSize,
    changeCollectionName,
    changeCollationOption,
    createCollection,
    openLink,
    toggleIsCapped,
    toggleIsCustomCollation,
    toggleIsVisible
  },
)(CreateCollectionModal);

export default MappedCreateCollectionModal;
export { CreateCollectionModal };
