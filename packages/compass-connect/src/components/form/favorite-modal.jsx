import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { ModalInput } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';

import FavoriteColorPicker from './favorite-color-picker';

import styles from '../connect.less';

/**
 * The favorite modal.
 */
class FavoriteModal extends PureComponent {
  static displayName = 'FavoriteModal';

  static propTypes = {
    connectionModel: PropTypes.object,
    deleteFavorite: PropTypes.func,
    saveFavorite: PropTypes.func,
    closeFavoriteModal: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = {
      name: props.connectionModel.name,
      color: props.connectionModel.color
    };
  }

  /**
   * Deletes a favorite.
   */
  onDeleteFavoriteClicked() {
    this.props.deleteFavorite(this.props.connectionModel);
  }

  /**
   * Changes the favorite color.
   *
   * @param {String} color - The favorite color.
   */
  handleChangeColor(color) {
    this.setState({ color });
  }

  /**
   * Closes modal.
   */
  handleClose() {
    this.props.closeFavoriteModal();
  }

  /**
   * Saves the favorite.
   */
  handleSave() {
    this.props.saveFavorite(this.state.name, this.state.color);
  }

  /**
   * Submits the form.
   *
   * @param {Object} evt - evt.
   */
  handleFormSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.handleSave();
  }

  /**
   * Changes the favorite name.
   *
   * @param {Object} evt - evt.
   */
  handleChangeName(evt) {
    this.setState({ name: evt.target.value });
  }

  /**
   * Renders "Remove" button.
   *
   * @returns {React.Component}
   */
  renderDeleteFavorite() {
    if (this.props.connectionModel.isFavorite) {
      return (
        <div className={classnames(styles['delete-favorite'])}>
          <TextButton
            className="btn btn-default btn-sm"
            dataTestId="delete-favorite-button"
            text="Remove"
            clickHandler={this.onDeleteFavoriteClicked.bind(this)} />
        </div>
      );
    }
  }

  /**
   * Renders a modal title.
   *
   * @returns {String}
   */
  renderModalTitle() {
    return this.props.connectionModel.isFavorite
      ? 'Edit favorite'
      : 'Save connection to favorites';
  }

  /**
   * Renders the favorite modal.
   *
   * @returns {React.Component} The favorite modal.
   */
  render() {
    return (
      <Modal
        show
        backdrop="static"
        dialogClassName={classnames(styles['favorite-modal'])}
      >
        <Modal.Header>
          <Modal.Title>{this.renderModalTitle()}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={classnames(styles['modal-body'])}>
          <form
            name="favorite-modal"
            onSubmit={this.handleFormSubmit.bind(this)}
            data-test-id="favorite-modal">
            <ModalInput
              autoFocus
              id="favorite-name"
              name="Name"
              value={this.state.name}
              onChangeHandler={this.handleChangeName.bind(this)} />
            <p>Color</p>
            <FavoriteColorPicker
              hex={this.state.color}
              onChange={this.handleChangeColor.bind(this)} />
          </form>
        </Modal.Body>
        <Modal.Footer className={classnames(styles['modal-footer'])}>
          {this.renderDeleteFavorite()}
          <div className={classnames(styles['cancel-dave-favorite'])}>
            <TextButton
              className="btn btn-default btn-sm"
              dataTestId="cancel-favorite-button"
              text="Cancel"
              clickHandler={this.handleClose.bind(this)} />
            <TextButton
              className="btn btn-primary btn-sm"
              dataTestId="create-favorite-button"
              text="Save"
              clickHandler={this.handleSave.bind(this)} />
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default FavoriteModal;
