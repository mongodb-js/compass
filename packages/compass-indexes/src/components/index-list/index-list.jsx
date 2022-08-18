import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import map from 'lodash.map';
import IndexComponent from '../index-component';

/**
 * Component for the index list.
 */
class IndexList extends PureComponent {
  static displayName = 'IndexList';

  static propTypes = {
    indexes: PropTypes.array.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    isWritable: PropTypes.bool.isRequired,
    localAppRegistry: PropTypes.object.isRequired,
    nameChanged: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
  };

  /**
   * Render the index list.
   *
   * @returns {React.Component} The index list.
   */
  render() {
    const indexes = map(this.props.indexes, (model) => {
      return (
        <IndexComponent
          key={model.name}
          index={model}
          isReadonly={this.props.isReadonly}
          isWritable={this.props.isWritable}
          localAppRegistry={this.props.localAppRegistry}
          nameChanged={this.props.nameChanged}
          openLink={this.props.openLink}
        />
      );
    });
    return <tbody data-test-id="index-list">{indexes}</tbody>;
  }
}

export default IndexList;
