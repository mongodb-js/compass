import Collation from 'components/collation';
import TimeSeries from 'components/time-series';
import { TextButton } from 'hadron-react-buttons';
import { ModalCheckbox, ModalStatusMessage } from 'hadron-react-components';
import { createCollection } from 'modules/create-collection';
import { changeCappedSize } from 'modules/create-collection/capped-size';
import { changeCollationOption } from 'modules/create-collection/collation';
import { changeTimeSeriesOption } from 'modules/create-collection/time-series';
import { toggleIsCapped } from 'modules/create-collection/is-capped';
import { toggleIsTimeSeries } from 'modules/create-collection/is-time-series';
import { toggleIsCustomCollation } from 'modules/create-collection/is-custom-collation';
import { changeCollectionName } from 'modules/create-collection/name';
import { clearError } from 'modules/error';
import { toggleIsVisible } from 'modules/is-visible';
import { openLink } from 'modules/link';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import styles from './create-collection-modal.less';
import TextInput from '@leafygreen-ui/text-input';
import hasTimeSeriesSupport from '../../modules/has-time-series-support';

/**
 * The help icon for capped collections url.
 */
const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The help URL for collation.
 */
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * The help URL for time series.
 */
const HELP_URL_TIME_SERIES = 'https://docs.mongodb.com/manual/reference/method/db.createCollection/';

/**
 * The modal to create a collection.
 */
class CreateCollectionModal extends PureComponent {
  static displayName = 'CreateCollectionModalComponent';

  static propTypes = {
    isCapped: PropTypes.bool.isRequired,
    isCustomCollation: PropTypes.bool.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
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
    changeTimeSeriesOption: PropTypes.func.isRequired,
    createCollection: PropTypes.func.isRequired,
    toggleIsCapped: PropTypes.func.isRequired,
    toggleIsCustomCollation: PropTypes.func.isRequired,
    toggleIsTimeSeries: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    clearError: PropTypes.func,
    serverVersion: PropTypes.string.isRequired
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

  onToggleIsTimeSeries = () => {
    this.props.toggleIsTimeSeries(!this.props.isTimeSeries);
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
   * Called when the error message close icon is clicked.
  */
  onDismissErrorMessage = () => {
    this.props.clearError();
  }

  /**
   * Render the capped size component when capped is selected.
   *
   * @returns {React.Component} The component.
   */
  renderCappedSize() {
    if (this.props.isCapped) {
      return (
        <div className="form-group">
          <TextInput
            label="size"
            type="number"
            description="Maximum size in bytes for the capped collection."
            onChange={this.onCappedSizeChange}
            value={this.props.cappedSize}
          />
        </div>
      );
    }
  }


  renderTimeSeries() {
    if (this.props.isTimeSeries) {
      return (
        <div className={styles['create-collection-modal-is-time-series-wrapper']}>
          <TimeSeries changeTimeSeriesOption={this.props.changeTimeSeriesOption}
            timeSeries={this.props.collation}/>
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

  renderCappedSizeCheckbox() {
    return (<div><ModalCheckbox
      name="Capped Collection"
      titleClassName={styles['create-collection-modal-is-capped']}
      checked={this.props.isCapped}
      helpUrl={HELP_URL_CAPPED}
      onClickHandler={this.onToggleIsCapped}
      onLinkClickHandler={this.props.openLink} />
    {this.renderCappedSize()}
    </div>);
  }

  renderTimeSeriesCheckbox() {
    if (!hasTimeSeriesSupport(this.props.serverVersion)) {
      return;
    }

    return (<div>
      <ModalCheckbox
        name="Time-Series"
        titleClassName={styles['create-collection-time-series']}
        checked={this.props.isTimeSeries}
        helpUrl={HELP_URL_TIME_SERIES}
        onClickHandler={this.onToggleIsTimeSeries}
        onLinkClickHandler={this.props.openLink} />
      {this.renderTimeSeries()}</div>);
  }

  renderCustomCollationCheckbox() {
    return (<div>
      <ModalCheckbox
        name="Use Custom Collation"
        titleClassName={styles['create-collection-modal-is-custom-collation']}
        checked={this.props.isCustomCollation}
        helpUrl={HELP_URL_COLLATION}
        onClickHandler={this.onToggleIsCustomCollation}
        onLinkClickHandler={this.props.openLink} />
      {this.renderCollation()}</div>);
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
        dialogClassName={styles['create-collection-modal']}>

        <Modal.Header>
          <Modal.Title>Create Collection</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form
            name="create-collection-modal-form"
            onSubmit={this.onFormSubmit}
            data-test-id="create-collection-modal">

            <div className="form-group">
              <TextInput
                id="create-collection-name"
                autoFocus
                label="Collection Name"
                onChange={this.onNameChange}
                value={this.props.name}
              />
            </div>
            <div className="form-group">
              {this.renderCappedSizeCheckbox()}
              {this.renderCustomCollationCheckbox()}
              {this.renderTimeSeriesCheckbox()}
            </div>
            {this.props.error ?
              <ModalStatusMessage
                icon="times" message={this.props.error.message} type="error"
                onIconClickHandler={this.onDismissErrorMessage} />
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
            disabled={!this.props.name}
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
  isTimeSeries: state.isTimeSeries,
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  name: state.name,
  collation: state.collation,
  cappedSize: state.cappedSize,
  error: state.error,
  serverVersion: state.serverVersion
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
    changeTimeSeriesOption,
    createCollection,
    openLink,
    toggleIsCapped,
    toggleIsTimeSeries,
    toggleIsCustomCollation,
    toggleIsVisible,
    clearError
  },
)(CreateCollectionModal);

export default MappedCreateCollectionModal;
export { CreateCollectionModal };
