import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ModalInput } from 'hadron-react-components';
import { ConfirmationModal } from '@mongodb-js/compass-components';

import FavoriteColorPicker from './favorite-color-picker';

/**
 * The favorite modal.
 */
class FavoriteModal extends PureComponent {
  static displayName = 'FavoriteModal';

  static propTypes = {
    connectionModel: PropTypes.object,
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
   * Renders the favorite modal.
   *
   * @returns {React.Component} The favorite modal.
   */
  render() {
    return (
      <ConfirmationModal
        title={
          this.props.connectionModel.isFavorite
            ? 'Edit favorite'
            : 'Save connection to favorites'
        }
        open
        onConfirm={this.handleSave.bind(this)}
        onCancel={this.handleClose.bind(this)}
        buttonText="Save"
        trackingId="favorite_modal"
      >
        <form
          name="favorite-modal"
          onSubmit={this.handleFormSubmit.bind(this)}
          data-test-id="favorite-modal"
        >
          <ModalInput
            autoFocus
            id="favorite-name"
            name="Name"
            value={this.state.name}
            onChangeHandler={this.handleChangeName.bind(this)}
          />
          <p>Color</p>
          <FavoriteColorPicker
            hex={this.state.color}
            onChange={this.handleChangeColor.bind(this)}
          />
        </form>
      </ConfirmationModal>
    );
  }
}

export default FavoriteModal;
