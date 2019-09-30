import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { ModalInput } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import Actions from 'actions';

import styles from '../connect.less';

/**
 * The favorite modal.
 */
class FavoriteModal extends PureComponent {
  static displayName = 'FavoriteModal';

  static propTypes = {
    currentConnection: PropTypes.object,
    isModalVisible: PropTypes.bool.isRequired
  }

  constructor(props) {
    super(props);
    this.state = { name: props.currentConnection.name };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.currentConnection.name !== this.state.name) {
      this.setState({ name: nextProps.currentConnection.name });
    }
  }

  /**
   * Deletes a favorite.
   */
  onDeleteFavoriteClicked() {
    Actions.onDeleteConnectionClicked(this.props.currentConnection);
    Actions.hideFavoriteModal();
  }

  /**
   * Closes modal.
   */
  handleClose() {
    Actions.hideFavoriteModal();
  }

  /**
   * Saves the favorite.
   */
  handleSave() {
    Actions.onCreateFavoriteClicked(this.state.name);
    Actions.hideFavoriteModal();
    setTimeout(() => Actions.showFavoriteMessage(), 800);
    setTimeout(() => Actions.hideFavoriteMessage(), 2800);
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
    if (this.props.currentConnection.isFavorite) {
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
    return this.props.currentConnection.isFavorite
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
        show={this.props.isModalVisible}
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
