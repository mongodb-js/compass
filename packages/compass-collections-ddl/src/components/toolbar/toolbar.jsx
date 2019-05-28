import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import createCollectionStore from 'stores/create-collection';
import { TextButton } from 'hadron-react-buttons';
import { Tooltip } from 'hadron-react-components';

import styles from './toolbar.less';

/**
 * The button component name.
 */
const BUTTON = 'DeploymentAwareness.TextWriteButton';

const DATA_LAKE_WARNING = 'Creating collections is not supported by Atlas Data Lake';

/**
 * The toolbar component.
 */
class Toolbar extends PureComponent {
  static displayName = 'ToolbarComponent';

  static propTypes = {
    isReadonly: PropTypes.bool.isRequired,
    databaseName: PropTypes.string,
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
   * Dispatch directly on the create collection store.
   */
  onShowCreateCollection = () => {
    createCollectionStore.dispatch(this.props.open(this.props.databaseName));
  }

  /**
   * Render the create collection button.
   *
   * @returns {Component} The button component.
   */
  renderButton() {
    if (this.props.isDataLake) {
      return (
        <div className={classnames(styles['tooltip-wrapper-class'])} data-tip={DATA_LAKE_WARNING} data-for="collections-ddl-is-not-writable">
          <TextButton
            className="btn btn-primary btn-xs"
            dataTestId="open-create-collection-modal-button"
            text="Create Collection"
            tooltipId="collections-ddl-is-not-writable"
            disabled
            clickHandler={this.onShowCreateCollection}
          />
          <Tooltip id="collections-ddl-is-not-writable" place="right"/>
        </div>
      );
    }
    if (!this.props.isReadonly) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-collection-modal-button"
          text="Create Collection"
          tooltipId="collections-ddl-is-not-writable"
          clickHandler={this.onShowCreateCollection}
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
      <div className={classnames(styles.toolbar)}>
        {this.renderButton()}
      </div>
    );
  }
}

export default Toolbar;
