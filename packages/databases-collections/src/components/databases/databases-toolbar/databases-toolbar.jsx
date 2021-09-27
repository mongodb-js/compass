import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { TextButton } from 'hadron-react-buttons';
import { Tooltip } from 'hadron-react-components';

import createDatabaseStore from '../../../stores/create-database';

import styles from './databases-toolbar.module.less';

/**
 * The button component name.
 */
const BUTTON = 'DeploymentAwareness.TextWriteButton';

const DATA_LAKE_WARNING = 'Creating databases is not supported by Atlas Data Lake';

/**
 * The databases view toolbar component.
 */
class DatabasesToolbar extends PureComponent {
  static displayName = 'DatabasesToolbarComponent';

  static propTypes = {
    isReadonly: PropTypes.bool.isRequired,
    open: PropTypes.func.isRequired,
    isDataLake: PropTypes.bool.isRequired
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
    createDatabaseStore.dispatch(this.props.open());
  }

  /**
   * Render the create database button.
   *
   * @returns {Component} The button component.
   */
  renderButton() {
    if (this.props.isDataLake) {
      return (
        <div className={styles['tooltip-wrapper-class']} data-tip={DATA_LAKE_WARNING} data-for="database-ddl-is-not-writable">
          <TextButton
            className="btn btn-primary btn-xs"
            dataTestId="open-create-database-modal-button"
            text="Create Database"
            tooltipId="database-ddl-is-not-writable"
            disabled
            clickHandler={this.onShowCreateDatabase}
          />
          <Tooltip id="database-ddl-is-not-writable" place="right" />
        </div>
      );
    }
    if (!this.props.isReadonly) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-database-modal-button"
          text="Create Database"
          tooltipId="database-ddl-is-not-writable"
          clickHandler={this.onShowCreateDatabase}
        />
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
      <div className={styles.toolbar}>
        {this.renderButton()}
      </div>
    );
  }
}

export default DatabasesToolbar;
