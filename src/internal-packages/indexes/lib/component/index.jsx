'use strict';

const React = require('react');
const NameColumn = require('./name-column');
const TypeColumn = require('./type-column');
const SizeColumn = require('./size-column');
const UsageColumn = require('./usage-column');
const PropertyColumn = require('./property-column');

/**
 * Component for the index.
 */
class Index extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    console.log(props.index);
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
          unit='kb'
          relativeSize={this.props.index.relativeSize} />
        <UsageColumn usage={this.props.index.usageCount} since={this.props.index.usageSince} />
        <PropertyColumn index={this.props.index} />
      </tr>
    );
  }
}

Index.displayName = 'Index';

module.exports = Index;
