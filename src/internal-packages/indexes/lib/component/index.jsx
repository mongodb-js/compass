const React = require('react');
const PropTypes = require('prop-types');
const NameColumn = require('./name-column');
const TypeColumn = require('./type-column');
const SizeColumn = require('./size-column');
const UsageColumn = require('./usage-column');
const PropertyColumn = require('./property-column');
const DropColumn = require('./drop-column');
const app = require('hadron-app');

/**
 * Component for the index.
 */
class Index extends React.Component {

  constructor(props) {
    super(props);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

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
        {this.CollectionStore.isWritable() ?
          <DropColumn indexName={this.props.index.name} />
          : null}
      </tr>
    );
  }
}

Index.displayName = 'Index';

Index.propTypes = {
  index: PropTypes.object.isRequired
};

module.exports = Index;
