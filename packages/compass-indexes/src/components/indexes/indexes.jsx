/* eslint dot-notation: 0 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { writeStateChanged } from '../../modules/is-writable';
import { dataServiceConnected } from '../../modules/data-service';
import { sortIndexes } from '../../modules/indexes';
import { reset } from '../../modules/reset';
import { changeName } from '../../modules/drop-index/name';
import { openLink } from '../../modules/link';

import IndexHeader from '../index-header';
import IndexList from '../index-list';
import { IndexesToolbar } from '../indexes-toolbar';

import { css, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  overflow: 'hidden',
});
const indexesStyles = css({
  width: '100%',
  padding: spacing[3],
  paddingTop: 0,
  flexGrow: 1,
  overflow: 'auto',
});
const indexesTableStyles = css({
  tableLayout: 'auto',
  borderCollapse: 'separate',
  borderSpacing: '0 3px',
  width: '100%',
});

class Indexes extends PureComponent {
  static displayName = 'IndexesComponent';

  static propTypes = {
    isWritable: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isReadonlyView: PropTypes.bool.isRequired,
    indexes: PropTypes.array.isRequired,
    sortColumn: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortIndexes: PropTypes.func.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    reset: PropTypes.func.isRequired,
    errorMessage: PropTypes.string,
    changeName: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    writeStateDescription: PropTypes.string.isRequired,
  };

  renderComponent() {
    return (
      <div className={indexesStyles}>
        <table className={indexesTableStyles}>
          <IndexHeader
            isWritable={this.props.isWritable}
            isReadonly={this.props.isReadonly}
            indexes={this.props.indexes}
            sortColumn={this.props.sortColumn}
            sortOrder={this.props.sortOrder}
            sortIndexes={this.props.sortIndexes}
          />
          <IndexList
            isWritable={this.props.isWritable}
            isReadonly={this.props.isReadonly}
            indexes={this.props.indexes}
            localAppRegistry={this.props.localAppRegistry}
            changeName={this.props.changeName}
            openLink={this.props.openLink}
          />
        </table>
      </div>
    );
  }

  /**
   * Render the indexes.
   *
   * @returns {React.Component} The indexes.
   */
  render() {
    return (
      <div className={containerStyles}>
        <IndexesToolbar
          isWritable={this.props.isWritable}
          isReadonly={this.props.isReadonly}
          isReadonlyView={this.props.isReadonlyView}
          errorMessage={this.props.errorMessage}
          localAppRegistry={this.props.localAppRegistry}
          writeStateDescription={this.props.writeStateDescription}
        />
        {!this.props.isReadonlyView &&
          !this.props.errorMessage &&
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
  writeStateDescription: state.description,
  errorMessage: state.error,
  dataService: state.dataService,
  sortColumn: state.sortColumn,
  sortOrder: state.sortOrder,
  localAppRegistry: state.appRegistry.localAppRegistry,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedIndexes = connect(mapStateToProps, {
  writeStateChanged,
  dataServiceConnected,
  sortIndexes,
  reset,
  changeName,
  openLink,
})(Indexes);

export default MappedIndexes;
export { Indexes };
