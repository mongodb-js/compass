import React from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import Sidebar from './sidebar';
import ConnectionForm from './form/connection-form';
import ConnectionString from './form/connection-string';
import Help from './form/help';
import Actions from 'actions';
import classnames from 'classnames';

import styles from './connect.less';

class Connect extends React.Component {
  static displayName = 'Connect';

  static propTypes = {
    currentConnection: PropTypes.object,
    connections: PropTypes.object,
    viewType: PropTypes.string
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
   * Renders the form with connection attributes or the URI input.
   *
   * @returns {React.Component}
   */
  renderConnectScreen() {
    if (this.props.viewType === 'connectionString') {
      return (<ConnectionString {...this.props} />);
    }

    return (<ConnectionForm {...this.props} />);
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
            onClick={this.onChangeViewClicked.bind(this, 'connectionForm')}>
            Fill in connection fields individually
          </a>
        </div>
      );
    }

    return (
      <div className={classnames(styles['change-view-link'])}>
        <a
          onClick={this.onChangeViewClicked.bind(this, 'connectionString')}>
          Paste connection string
        </a>
      </div>
    );
  }

  render() {
    const Status = global.hadronApp.appRegistry
      .getRole('Application.Status')[0].component;

    return (
      <div>
        <Status />
        <div className={classnames(styles.page, styles.connect)}>
          <Sidebar {...this.props} />
          <div className={classnames(styles['form-container'])}>
            <div className={classnames(styles['connect-container'])}>
              <header>
                <h2>New Connection</h2>
                {this.renderChangeViewLink()}
              </header>
              {this.renderConnectScreen()}
            </div>
            <Help {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}

export default Connect;
