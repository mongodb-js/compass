const React = require('react');
const IndexDefinitionType = require('./index-definition-type');

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
  index: React.PropTypes.object.isRequired
};

module.exports = IndexDefinition;
