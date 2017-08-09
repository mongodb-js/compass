const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const MongodbJsCompassConnectComponent = require('./@mongodb-js/compass-connect');
const Store = require('../stores');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:-mongodb-js-compass-connect:index');

class ConnectedMongodbJsCompassConnectComponent extends React.Component {
  /**
   * Connect MongodbJsCompassConnectComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <MongodbJsCompassConnectComponent actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedMongodbJsCompassConnectComponent.displayName = 'ConnectedMongodbJsCompassConnectComponent';

module.exports = ConnectedMongodbJsCompassConnectComponent;
