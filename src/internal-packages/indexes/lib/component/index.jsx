const React = require('react');
const NameColumn = require('./name-column');
const TypeColumn = require('./type-column');
const SizeColumn = require('./size-column');
const UsageColumn = require('./usage-column');
const PropertyColumn = require('./property-column');
const DropColumn = require('./drop-column');
const app = require('ampersand-app');

/**
 * Component for the index.
 */
class Index extends React.Component {

  /**
   * Render the index.
   *
   * @returns {React.Component} The index.
   */
  render() {
    return (
      <tr>
        <NameColumn index={this.props.index} />
        <TypeColumn index={this.props.index} />
        <SizeColumn
          size={this.props.index.size}
          relativeSize={this.props.index.relativeSize} />
        <UsageColumn usage={this.props.index.usageCount} since={this.props.index.usageSince} />
        <PropertyColumn index={this.props.index} />
        {app.dataService.isWritable() ?
          <DropColumn indexName={this.props.index.name} />
          : null}
      </tr>
    );
  }
}

Index.displayName = 'Index';

Index.propTypes = {
  index: React.PropTypes.object.isRequired
};

module.exports = Index;
