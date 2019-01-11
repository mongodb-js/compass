import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import CreateDatabaseModal from 'components/create-database-modal';
import createDatabaseStore from 'stores/create-database';

import styles from './toolbar.less';

/**
 * The button component name.
 */
const BUTTON = 'DeploymentAwareness.TextWriteButton';

/**
 * The toolbar component.
 */
class Toolbar extends PureComponent {
  static displayName = 'ToolbarComponent';

  static propTypes = {
    isReadonly: PropTypes.bool.isRequired,
    showCreateDatabase: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired
  }

  /**
   * On instantiation get the write button from deployment awareness.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.TextWriteButton = global.hadronApp.appRegistry.getComponent(BUTTON);
  }

  /**
   * Dispatch directly on the create database store.
   */
  onShowCreateDatabase = () => {
    createDatabaseStore.dispatch(this.props.reset());
    createDatabaseStore.dispatch(this.props.showCreateDatabase());
  }

  /**
   * Render the create database button.
   *
   * @returns {Component} The button component.
   */
  renderButton() {
    if (!this.props.isReadonly) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-database-modal-button"
          text="Create Database"
          tooltipId="database-ddl-is-not-writable"
          clickHandler={this.onShowCreateDatabase} />
      );
    }
  }

  /**
   * Render Toolbar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.toolbar)}>
        {this.renderButton()}
        <Provider store={createDatabaseStore}>
          <CreateDatabaseModal />
        </Provider>
      </div>
    );
  }
}

export default Toolbar;
