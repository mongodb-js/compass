const React = require('react');
const IndexHeader = require('./index-header');
const IndexList = require('./index-list');
const CreateIndexButton = require('./create-index-button');
const app = require('ampersand-app');

/**
 * Component for the indexes.
 */
class Indexes extends React.Component {

  /**
   * Render the indexes.
   *
   * @returns {React.Component} The indexes.
   */
  render() {
    return (
      <div className="index-container">
        <div className="flexbox-fix"></div>
        <div className="column-container">
          <div className="column main">
            {app.preferences.isFeatureEnabled('indexDDL') ?
              <CreateIndexButton />
              : null}
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
