import React from 'react';
import PropTypes from 'prop-types';
import IndexDefinitionType from 'components/index-definition-type';

/**
 * Component for an index definition.
 */
class IndexDefinition extends React.Component {

  /**
   * Render the index definition
   *
   * @returns {React.Component} The index definition.
   */
  render() {
    return (
      <div className="index-definition">
        <div className="name" data-test-id="index-table-name" title={this.props.index.name}>
          {this.props.index.name}
        </div>
        <IndexDefinitionType index={this.props.index} />
      </div>
    );
  }
}

IndexDefinition.displayName = 'IndexDefinition';

IndexDefinition.propTypes = {
  index: PropTypes.object.isRequired
};

export default IndexDefinition;
