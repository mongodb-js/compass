import classnames from 'classnames';
import { remote } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from '@mongodb-js/compass-components';

import Actions from '../actions';
import Sidebar from './sidebar';
import ConnectionForm from './form/connection-form';
import ConnectionString from './form/connection-string';
import Help from './form/help';
import IsFavoritePill from './form/is-favorite-pill';
import ConfirmEditConnectionString from './modal/confirm-edit-connection-string';
import Connecting from './modal/connecting';
import {
  CONNECTION_FORM_VIEW,
  CONNECTION_STRING_VIEW
} from '../constants/connection-views';
import styles from './connect.module.less';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-CONNECT-UI');

class Connect extends React.Component {
  static displayName = 'Connect';

  static propTypes = {
    connectingStatusText: PropTypes.string,
    connectionModel: PropTypes.object,
    connections: PropTypes.object,
    currentConnectionAttempt: PropTypes.object,
    isConnected: PropTypes.bool,
    viewType: PropTypes.string,
    isModalVisible: PropTypes.bool,
    isMessageVisible: PropTypes.bool,
    savedMessage: PropTypes.string,
    isEditURIConfirm: PropTypes.bool
  };

  componentDidMount() {
    document.title = `${remote.app.getName()} - Connect`;
    track('Screen', { name: 'connect' });
  }

  /**
   * Changes viewType.
   *
   * @param {React.SyntheticEvent<HTMLButtonElement, MouseEvent>} evt
   */
  onChangeViewClicked(evt) {
    Actions.onChangeViewClicked(evt.currentTarget.dataset.viewType);
  }

  /**
   * Hides a message that a favorite was saved.
   */
  handleMouseMove() {
    if (this.props.isMessageVisible) {
      Actions.hideFavoriteMessage();
    }
  }

  /**
   * Renders the form with connection attributes or the URI input.
   *
   * @returns {React.Component}
   */
  renderConnectScreen() {
    if (this.props.viewType === CONNECTION_STRING_VIEW) {
      return <ConnectionString {...this.props} />;
    }

    return <ConnectionForm {...this.props} />;
  }

  /**
   * Renders the change view type link.
   *
   * @returns {React.Component}
   */
  renderChangeViewLink() {
    const showConnectionForm = this.props.viewType === CONNECTION_STRING_VIEW;
    const testId = `show-connection-${
      showConnectionForm ? 'form' : 'string'
    }-button`;

    return (
      <div className={styles['change-view-link']}>
        <Link
          as="button"
          hideExternalIcon
          data-test-id={testId}
          data-view-type={
            showConnectionForm ? CONNECTION_FORM_VIEW : CONNECTION_STRING_VIEW
          }
          onClick={this.onChangeViewClicked}
          className={styles['change-view-link-button']}
        >
          {showConnectionForm
            ? 'Fill in connection fields individually'
            : 'Paste connection string'}
        </Link>
      </div>
    );
  }

  /**
   * Renders a header.
   *
   * @returns {React.Component}
   */
  renderHeader() {
    let name = 'New Connection';

    if (this.props.connectionModel.isFavorite) {
      name =
        this.props.connectionModel.name.length > 40
          ? `${this.props.connectionModel.name.substring(0, 40)}...`
          : this.props.connectionModel.name;
    }

    return (
      <header>
        <h2>{name}</h2>
        <IsFavoritePill
          connectionModel={this.props.connectionModel}
          isModalVisible={this.props.isModalVisible}
          isMessageVisible={this.props.isMessageVisible}
          savedMessage={this.props.savedMessage}
          color={this.props.connectionModel.color}
          isFavorite={this.props.connectionModel.isFavorite}
        />
      </header>
    );
  }

  render() {
    const Status =
      global.hadronApp.appRegistry.getRole('Application.Status')[0].component;

    const showNewConnectForm = process.env.USE_NEW_CONNECT_FORM === 'true';

    return (
      <div>
        <Status />
        <div
          data-test-id="connect-section"
          className={classnames(styles.page, styles.connect)}
        >
          <Sidebar {...this.props} />
          <div className={styles['form-container']}>
            {!showNewConnectForm && (
              <div
                className={styles['connect-container']}
                onMouseMove={this.handleMouseMove.bind(this)}
              >
                {this.renderHeader()}
                {this.renderChangeViewLink()}
                {this.renderConnectScreen()}
              </div>
            )}
            <Help {...this.props} />
          </div>
          <Connecting
            connectingStatusText={this.props.connectingStatusText}
            currentConnectionAttempt={this.props.currentConnectionAttempt}
          />
          <ConfirmEditConnectionString
            isEditURIConfirm={this.props.isEditURIConfirm}
          />
        </div>
      </div>
    );
  }
}

export default Connect;
