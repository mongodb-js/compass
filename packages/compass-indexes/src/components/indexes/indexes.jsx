import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { IndexesToolbar } from '../indexes-toolbar';
import IndexesTable from '../indexes-table/indexes-table';

import { css, Card, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  margin: spacing[3],
  padding: spacing[3],
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: 'auto',
  overflowY: 'scroll',
});

class Indexes extends PureComponent {
  static displayName = 'IndexesComponent';

  static propTypes = {
    isWritable: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isReadonlyView: PropTypes.bool.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    errorMessage: PropTypes.string,
    writeStateDescription: PropTypes.string.isRequired,
  };

  render() {
    const {
      isWritable,
      isReadonly,
      isReadonlyView,
      errorMessage,
      localAppRegistry,
      writeStateDescription,
    } = this.props;
    return (
      <Card className={containerStyles} contentStyle="none">
        <IndexesToolbar
          isWritable={isWritable}
          isReadonly={isReadonly}
          isReadonlyView={isReadonlyView}
          errorMessage={errorMessage}
          localAppRegistry={localAppRegistry}
          writeStateDescription={writeStateDescription}
        />
        {!isReadonlyView && !errorMessage && <IndexesTable />}
      </Card>
    );
  }
}

const mapStateToProps = (state) => ({
  isWritable: state.isWritable,
  isReadonly: state.isReadonly,
  isReadonlyView: state.isReadonlyView,
  writeStateDescription: state.description,
  errorMessage: state.error,
  localAppRegistry: state.appRegistry.localAppRegistry,
});

const MappedIndexes = connect(mapStateToProps)(Indexes);

export default MappedIndexes;
export { Indexes };
