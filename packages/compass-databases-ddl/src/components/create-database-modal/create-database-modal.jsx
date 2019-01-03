import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import { hideCreateDatabase } from 'modules/create-database/is-visible';
import { openLink } from 'modules/link';

import styles from './create-database-modal.less';

/**
 * The more information url.
 */
// const INFO_URL_CREATE_DB =
// 'https://docs.mongodb.com/manual/faq/fundamentals/#how-do-i-create-a-database-and-a-collection';

/**
 * The help icon for capped collections url.
 */
// const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

/**
 * The help URL for collation.
 */
// const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

/**
 * The modal to create a database.
 */
class CreateDatabaseModal extends PureComponent {
  static displayName = 'CreateDatabaseModalComponent';

  static propTypes = {
    isCapped: PropTypes.bool.isRequired,
    isVisible: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    collectionName: PropTypes.string.isRequired,
    cappedSize: PropTypes.number,
    hideCreateDatabase: PropTypes.func.isRequired
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
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.props.hideCreateDatabase} />
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="create-database-button"
            text="Create Database"
            clickHandler={() => {}} />
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
  isVisible: state.isVisible,
  name: state.name,
  collectionName: state.collectionName,
  cappedSize: state.cappedSize
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedCreateDatabaseModal = connect(
  mapStateToProps,
  {
    hideCreateDatabase,
    openLink
  },
)(CreateDatabaseModal);

export default MappedCreateDatabaseModal;
export { CreateDatabaseModal };
