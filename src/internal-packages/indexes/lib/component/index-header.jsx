'use strict';

const React = require('react');
const IndexHeaderColumn = require('./index-header-column');

/**
 * Component for the index header.
 */
class IndexHeader extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the index header.
   *
   * @returns {React.Component} The index header.
   */
  render() {
    return (
      <thead>
        <tr>
          <IndexHeaderColumn name='Name and Definition' active={true} />
          <IndexHeaderColumn name='Type' active={false} />
          <IndexHeaderColumn name='Size' active={false} />
          <IndexHeaderColumn name='Usage' active={false} />
          <IndexHeaderColumn name='Properties' active={false} />
        </tr>
      </thead>
    );
  }
}

IndexHeader.displayName = 'IndexHeader';

module.exports = IndexHeader;
