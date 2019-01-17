import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import CreateCollectionModal from 'components/create-collection-modal';
import createCollectionStore from 'stores/create-collection';

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
    databaseName: PropTypes.string.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    changeDatabaseName: PropTypes.func.isRequired,
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
   * Dispatch directly on the create collection store.
   */
  onShowCreateCollection = () => {
    createCollectionStore.dispatch(this.props.reset());
    createCollectionStore.dispatch(this.props.changeDatabaseName(this.props.databaseName));
    createCollectionStore.dispatch(this.props.toggleIsVisible(true));
  }

  /**
   * Render the create collection button.
   *
   * @returns {Component} The button component.
   */
  renderButton() {
    if (!this.props.isReadonly) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-collection-modal-button"
          text="Create Collection"
          tooltipId="collection-ddl-is-not-writable"
          clickHandler={this.onShowCreateCollection} />
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
        <Provider store={createCollectionStore}>
          <CreateCollectionModal />
        </Provider>
      </div>
    );
  }
}

export default Toolbar;
