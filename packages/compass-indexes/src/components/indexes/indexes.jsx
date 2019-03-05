/* eslint dot-notation: 0 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect, Provider } from 'react-redux';
import { StatusRow } from 'hadron-react-components';

import { writeStateChanged } from 'modules/is-writable';
import { getDescription } from 'modules/description';
import { dataServiceConnected } from 'modules/data-service';
import { sortIndexes } from 'modules/indexes';
import { toggleIsVisible } from 'modules/is-visible';
import { reset } from 'modules/reset';
import { changeName } from 'modules/drop-index/name';
import { openLink } from 'modules/link';

import CreateIndexButton from 'components/create-index-button';
import DropIndexModal from 'components/drop-index-modal';
import IndexHeader from 'components/index-header';
import IndexList from 'components/index-list';

import dropIndexStore from 'stores/drop-index';

import classnames from 'classnames';
import styles from './indexes.less';

class Indexes extends PureComponent {
  static displayName = 'IndexesComponent';

  static propTypes = {
    isWritable: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isReadonlyView: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired,
    indexes: PropTypes.array.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortIndexes: PropTypes.func.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    error: PropTypes.string,
    changeName: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired
  };

  renderComponent() {
    return (
      <div className="column-container">
        <div className="column main">
          <table className={classnames(styles['indexes'])}>
            <IndexHeader
              isWritable={this.props.isWritable}
              isReadonly={this.props.isReadonly}
              indexes={this.props.indexes}
              sortColumn={this.props.sortColumn}
              sortOrder={this.props.sortOrder}
              sortIndexes={this.props.sortIndexes} />
            <IndexList
              isWritable={this.props.isWritable}
              isReadonly={this.props.isReadonly}
              indexes={this.props.indexes}
              toggleIsVisible={this.props.toggleIsVisible}
              changeName={this.props.changeName}
              openLink={this.props.openLink}
            />
          </table>
        </div>
      </div>
    );
  }

  renderBanner() {
    if (this.props.isReadonlyView) {
      return (
        <StatusRow style="warning">
          Readonly views may not contain indexes.
        </StatusRow>
      );
    }
    return (
      <StatusRow style="error">
        {this.props.error}
      </StatusRow>
    );
  }

  renderCreateIndexButton() {
    if (!this.props.isReadonly && !this.props.isReadonlyView && (this.props.error === null || this.props.error === undefined)) {
      return (
        <CreateIndexButton
          toggleIsVisible={this.props.toggleIsVisible}
        />
      );
    }
    return (
      <div className="create-index-btn action-bar" />
    );
  }

  renderDropIndexModal() {
    return (
      <Provider store={dropIndexStore}>
        <DropIndexModal />
      </Provider>
    );
  }

  /**
   * Render the indexes.
   *
   * @returns {React.Component} The indexes.
   */
  render() {
    return (
      <div className="index-container">
        <div className="controls-container">
          {this.renderCreateIndexButton()}
          {this.renderDropIndexModal()}
        </div>
        {(this.props.isReadonlyView || !(this.props.error === null || this.props.error === undefined)) ?
          this.renderBanner() :
          this.renderComponent()}
      </div>
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
  indexes: state.indexes,
  isWritable: state.isWritable,
  isReadonly: state.isReadonly,
  isReadonlyView: state.isReadonlyView,
  description: state.description,
  error: state.error,
  dataService: state.dataService,
  sortColumn: state.sortColumn,
  sortOrder: state.sortOrder
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedIndexes = connect(
  mapStateToProps,
  {
    writeStateChanged,
    getDescription,
    dataServiceConnected,
    sortIndexes,
    toggleIsVisible,
    reset,
    changeName,
    openLink
  },
)(Indexes);

export default MappedIndexes;
export { Indexes };
