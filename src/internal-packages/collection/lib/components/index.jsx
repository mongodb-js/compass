const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const Collection = require('./collection');
const Store = require('../store');

class ConnectedCollection extends React.Component {

  /**
   * Connect <Collection /> component to collection store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Collection />
      </StoreConnector>
    );
  }
}

ConnectedCollection.displayName = 'ConnectedCollection';

module.exports = ConnectedCollection;
