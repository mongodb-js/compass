'use strict';

const React = require('react');
const IndexHeader = require('./index-header');
const IndexList = require('./index-list');

/**
 * Component for the indexes.
 */
class Indexes extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the indexes.
   *
   * @returns {React.Component} The indexes.
   */
  render() {
    return (
      <div>
        <div className='flexbox-fix'></div>
        <div className='column-container'>
          <div className='column main'>
            <table>
              <IndexHeader />
              <IndexList />
            </table>
          </div>
        </div>
      </div>
    );
  }
}

Indexes.displayName = 'Indexes';

module.exports = Indexes;
