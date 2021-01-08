import classnames from 'classnames';
import { remote } from 'electron';
import PropTypes from 'prop-types';
import React from 'react';

import Actions from '../actions';
import Sidebar from './sidebar';
import ConnectionForm from './form/connection-form';
import ConnectionString from './form/connection-string';
import Help from './form/help';
import IsFavoritePill from './form/is-favorite-pill';
import ConfirmEditConnectionString from './modal/confirm-edit-connection-string';

import styles from './connect.less';

class Connect extends React.Component {
  static displayName = 'Connect';

  static propTypes = {
    currentConnection: PropTypes.object,
    connections: PropTypes.object,
    viewType: PropTypes.string,
    isModalVisible: PropTypes.bool,
    isMessageVisible: PropTypes.bool,
    savedMessage: PropTypes.string,
    isEditURIConfirm: PropTypes.bool
  };

  componentDidMount() {
    document.title = `${remote.app.getName()} - Connect`;
  }

  /**
   * Changes viewType.
   *
   * @param {String} viewType - viewType.
   * @param {Object} evt - evt.
   */
  onChangeViewClicked(viewType, evt) {
    evt.preventDefault();
    Actions.onChangeViewClicked(viewType);
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
    if (this.props.viewType === 'connectionString') {
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
    if (this.props.viewType === 'connectionString') {
      return (
        <div className={classnames(styles['change-view-link'])}>
          <a
            data-test-id="form-view-link"
            onClick={this.onChangeViewClicked.bind(this, 'connectionForm')}
          >
            Fill in connection fields individually
          </a>
        </div>
      );
    }

    return (
      <div className={classnames(styles['change-view-link'])}>
        <a onClick={this.onChangeViewClicked.bind(this, 'connectionString')}>
          Paste connection string
        </a>
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

    if (this.props.currentConnection.isFavorite) {
      name =
        this.props.currentConnection.name.length > 40
          ? `${this.props.currentConnection.name.substring(0, 40)}...`
          : this.props.currentConnection.name;
    }

    return (
      <header>
        <h2>{name}</h2>
        <IsFavoritePill
          currentConnection={this.props.currentConnection}
          isModalVisible={this.props.isModalVisible}
          isMessageVisible={this.props.isMessageVisible}
          savedMessage={this.props.savedMessage}
          color={this.props.currentConnection.color}
          isFavorite={this.props.currentConnection.isFavorite}
        />
      </header>
    );
  }

  render() {
    const Status = global.hadronApp.appRegistry.getRole('Application.Status')[0]
      .component;

    return (
      <div>
        <Status />
        <div className={classnames(styles.page, styles.connect)}>
          <Sidebar {...this.props} />
          <div className={classnames(styles['form-container'])}>
            <div
              className={classnames(styles['connect-container'])}
              onMouseMove={this.handleMouseMove.bind(this)}
            >
              {this.renderHeader()}
              {this.renderChangeViewLink()}
              {this.renderConnectScreen()}
            </div>
            <Help {...this.props} />
          </div>
          <ConfirmEditConnectionString
            isEditURIConfirm={this.props.isEditURIConfirm}
          />
        </div>
      </div>
    );
  }
}

export default Connect;
